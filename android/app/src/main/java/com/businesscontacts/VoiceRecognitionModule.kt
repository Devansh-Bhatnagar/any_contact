package com.businesscontacts

import android.app.Activity
import android.content.Intent
import android.speech.RecognizerIntent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.util.Locale

class VoiceRecognitionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var speechPromise: Promise? = null
    private val SPEECH_REQUEST_CODE = 4123

    private val activityEventListener: ActivityEventListener =
        object : BaseActivityEventListener() {
            override fun onActivityResult(
                activity: Activity,
                requestCode: Int,
                resultCode: Int,
                data: Intent?
            ) {
                if (requestCode == SPEECH_REQUEST_CODE) {
                    val promise = speechPromise
                    speechPromise = null
                    if (promise == null) return

                    if (resultCode == Activity.RESULT_OK && data != null) {
                        val results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                        if (!results.isNullOrEmpty()) {
                            val recognizedText = results[0]
                            promise.resolve(recognizedText)
                            return
                        }
                    }
                    promise.reject("CANCELLED", "Speech recognition was cancelled or returned empty")
                }
            }
        }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String {
        return "VoiceRecognition"
    }

    @ReactMethod
    fun startSpeechRecognition(prompt: String?, promise: Promise) {
        val currentActivity = reactContext.currentActivity
        if (currentActivity == null) {
            promise.reject("E_NO_ACTIVITY", "Current activity is null")
            return
        }

        try {
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(
                    RecognizerIntent.EXTRA_LANGUAGE_MODEL,
                    RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
                )
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(
                    RecognizerIntent.EXTRA_PROMPT,
                    if (!prompt.isNullOrEmpty()) prompt else "Say 'Call Aarav Sharma' or contact name"
                )
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            }
            speechPromise = promise
            currentActivity.startActivityForResult(intent, SPEECH_REQUEST_CODE)
        } catch (e: Exception) {
            speechPromise = null
            promise.reject("E_SPEECH_FAILED", e.message)
        }
    }
}
