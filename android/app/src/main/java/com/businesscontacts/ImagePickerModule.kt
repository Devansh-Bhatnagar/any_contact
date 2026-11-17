package com.businesscontacts

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors

class ImagePickerModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var pickerPromise: Promise? = null
    private var pendingCameraFile: File? = null
    private val executor = Executors.newSingleThreadExecutor()

    companion object {
        private const val REQUEST_GALLERY = 5101
        private const val REQUEST_CAMERA = 5102
        private const val MAX_IMAGE_DIMENSION = 1200
    }

    private val activityEventListener: ActivityEventListener =
        object : BaseActivityEventListener() {
            override fun onActivityResult(
                activity: Activity,
                requestCode: Int,
                resultCode: Int,
                data: Intent?
            ) {
                if (requestCode != REQUEST_GALLERY && requestCode != REQUEST_CAMERA) return

                val promise = pickerPromise
                pickerPromise = null
                val cameraFile = pendingCameraFile
                pendingCameraFile = null

                if (promise == null) return

                if (resultCode != Activity.RESULT_OK) {
                    if (cameraFile?.exists() == true) {
                        cameraFile.delete()
                    }
                    promise.reject("CANCELLED", "Image selection was cancelled")
                    return
                }

                if (requestCode == REQUEST_GALLERY) {
                    val uri = data?.data
                    if (uri == null) {
                        promise.reject("E_NO_IMAGE", "No image URI returned")
                        return
                    }
                    processUriAsync(uri, "img", promise)
                } else {
                    if (cameraFile != null && cameraFile.exists() && cameraFile.length() > 0) {
                        processFileAsync(cameraFile, promise)
                    } else {
                        val fallbackUri = data?.data
                        if (fallbackUri != null) {
                            processUriAsync(fallbackUri, "cam", promise)
                        } else {
                            promise.reject("E_CAMERA_FAILED", "Captured image not available")
                        }
                    }
                }
            }
        }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = "ImagePicker"

    private fun getUploadsDir(): File {
        val dir = File(reactContext.filesDir, "uploads")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    private fun calculateInSampleSize(
        options: BitmapFactory.Options,
        reqWidth: Int,
        reqHeight: Int
    ): Int {
        val height = options.outHeight
        val width = options.outWidth
        var inSampleSize = 1

        if (height > reqHeight || width > reqWidth) {
            val halfHeight = height / 2
            val halfWidth = width / 2
            while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2
            }
        }
        return inSampleSize
    }

    private fun applyExifRotation(bitmap: Bitmap, orientation: Int): Bitmap {
        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            else -> return bitmap
        }
        return try {
            val rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
            if (rotated != bitmap) bitmap.recycle()
            rotated
        } catch (_: Exception) {
            bitmap
        }
    }

    private fun resolveSuccess(outFile: File, promise: Promise) {
        val map = Arguments.createMap().apply {
            putString("uri", "file://${outFile.absolutePath}")
            putString("fileName", outFile.name)
            putString("type", "image/jpeg")
        }
        promise.resolve(map)
    }

    private fun processUriAsync(uri: Uri, prefix: String, promise: Promise) {
        executor.execute {
            try {
                val outFile = File(getUploadsDir(), "${prefix}_${System.currentTimeMillis()}.jpg")

                // Read EXIF orientation if available
                var orientation = ExifInterface.ORIENTATION_NORMAL
                try {
                    reactContext.contentResolver.openInputStream(uri)?.use { exifStream ->
                        val exif = ExifInterface(exifStream)
                        orientation = exif.getAttributeInt(
                            ExifInterface.TAG_ORIENTATION,
                            ExifInterface.ORIENTATION_NORMAL
                        )
                    }
                } catch (_: Exception) {
                    // Ignore missing EXIF
                }

                // First decode bounds only
                val boundsOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                reactContext.contentResolver.openInputStream(uri)?.use { boundStream ->
                    BitmapFactory.decodeStream(boundStream, null, boundsOpts)
                }

                val decodeOpts = BitmapFactory.Options().apply {
                    inSampleSize = calculateInSampleSize(boundsOpts, MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION)
                }

                val bitmap = reactContext.contentResolver.openInputStream(uri)?.use { imgStream ->
                    BitmapFactory.decodeStream(imgStream, null, decodeOpts)
                }

                if (bitmap != null) {
                    val rotated = applyExifRotation(bitmap, orientation)
                    FileOutputStream(outFile).use { fos ->
                        rotated.compress(Bitmap.CompressFormat.JPEG, 85, fos)
                        fos.flush()
                    }
                    rotated.recycle()
                    resolveSuccess(outFile, promise)
                } else {
                    // Fallback to direct raw byte copy if BitmapFactory couldn't decode
                    reactContext.contentResolver.openInputStream(uri)?.use { input ->
                        FileOutputStream(outFile).use { output ->
                            input.copyTo(output)
                        }
                    }
                    resolveSuccess(outFile, promise)
                }
            } catch (e: Exception) {
                promise.reject("E_IMAGE_PROCESS", e.message ?: "Failed to process selected image")
            }
        }
    }

    private fun processFileAsync(rawFile: File, promise: Promise) {
        executor.execute {
            try {
                val exif = ExifInterface(rawFile.absolutePath)
                val orientation = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )

                val boundsOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeFile(rawFile.absolutePath, boundsOpts)

                val decodeOpts = BitmapFactory.Options().apply {
                    inSampleSize = calculateInSampleSize(boundsOpts, MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION)
                }

                val bitmap = BitmapFactory.decodeFile(rawFile.absolutePath, decodeOpts)
                if (bitmap != null) {
                    val rotated = applyExifRotation(bitmap, orientation)
                    FileOutputStream(rawFile).use { fos ->
                        rotated.compress(Bitmap.CompressFormat.JPEG, 85, fos)
                        fos.flush()
                    }
                    rotated.recycle()
                }

                resolveSuccess(rawFile, promise)
            } catch (e: Exception) {
                promise.reject("E_CAMERA_PROCESS", e.message ?: "Failed to process captured photo")
            }
        }
    }

    @ReactMethod
    fun pickFromGallery(promise: Promise) {
        val currentActivity = reactContext.currentActivity
        if (currentActivity == null) {
            promise.reject("E_NO_ACTIVITY", "Current activity is null")
            return
        }

        try {
            val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                type = "image/*"
                addCategory(Intent.CATEGORY_OPENABLE)
            }
            val chooser = Intent.createChooser(intent, "Select Image")
            pickerPromise = promise
            currentActivity.startActivityForResult(chooser, REQUEST_GALLERY)
        } catch (e: Exception) {
            pickerPromise = null
            promise.reject("E_PICKER_FAILED", e.message ?: "Failed to open gallery")
        }
    }

    @ReactMethod
    fun captureFromCamera(promise: Promise) {
        val currentActivity = reactContext.currentActivity
        if (currentActivity == null) {
            promise.reject("E_NO_ACTIVITY", "Current activity is null")
            return
        }

        try {
            val outFile = File(getUploadsDir(), "cam_${System.currentTimeMillis()}.jpg")
            val photoUri = FileProvider.getUriForFile(
                reactContext,
                "${reactContext.packageName}.fileprovider",
                outFile
            )

            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
                addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION or Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            pendingCameraFile = outFile
            pickerPromise = promise
            currentActivity.startActivityForResult(intent, REQUEST_CAMERA)
        } catch (e: Exception) {
            pendingCameraFile?.delete()
            pendingCameraFile = null
            pickerPromise = null
            promise.reject("E_CAMERA_FAILED", e.message ?: "Failed to open camera")
        }
    }
}

