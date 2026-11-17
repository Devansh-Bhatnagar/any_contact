package com.businesscontacts

import android.content.ContentResolver
import android.content.pm.PackageManager
import android.database.Cursor
import android.provider.ContactsContract
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

class ContactsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ContactsModule"
    }

    @ReactMethod
    fun getContacts(promise: Promise) {
        Thread {
            try {
                if (ContextCompat.checkSelfPermission(
                        reactContext,
                        android.Manifest.permission.READ_CONTACTS
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    promise.reject("PERMISSION_DENIED", "READ_CONTACTS permission not granted")
                    return@Thread
                }

                val contentResolver: ContentResolver = reactContext.contentResolver

                // LinkedHashMap maintains alphabetical order from SQL query
                val contactsMap = LinkedHashMap<String, ContactEntry>()

                val phoneProjection = arrayOf(
                    ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
                    ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                    ContactsContract.CommonDataKinds.Phone.NUMBER,
                    ContactsContract.CommonDataKinds.Phone.TYPE,
                    ContactsContract.CommonDataKinds.Phone.LABEL,
                    ContactsContract.CommonDataKinds.Phone.PHOTO_URI,
                    ContactsContract.CommonDataKinds.Phone.PHOTO_THUMBNAIL_URI
                )

                val phoneSortOrder = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} COLLATE NOCASE ASC"

                var phoneCursor: Cursor? = null
                try {
                    phoneCursor = contentResolver.query(
                        ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                        phoneProjection,
                        null,
                        null,
                        phoneSortOrder
                    )

                    if (phoneCursor != null) {
                        val idIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
                        val nameIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                        val numberIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                        val typeIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.TYPE)
                        val labelIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.LABEL)
                        val photoIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_URI)
                        val thumbIdx = phoneCursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.PHOTO_THUMBNAIL_URI)

                        while (phoneCursor.moveToNext()) {
                            val contactId = if (idIdx >= 0) phoneCursor.getString(idIdx) else null ?: continue
                            val displayName = (if (nameIdx >= 0) phoneCursor.getString(nameIdx) else null)?.trim()
                            val rawNumber = if (numberIdx >= 0) phoneCursor.getString(numberIdx) else null ?: ""
                            val phoneType = if (typeIdx >= 0) phoneCursor.getInt(typeIdx) else ContactsContract.CommonDataKinds.Phone.TYPE_OTHER
                            val customLabel = if (labelIdx >= 0) phoneCursor.getString(labelIdx) else null
                            val photoUri = if (photoIdx >= 0) phoneCursor.getString(photoIdx) else null
                            val thumbUri = if (thumbIdx >= 0) phoneCursor.getString(thumbIdx) else null
                            val avatar = photoUri ?: thumbUri ?: ""

                            val label = when (phoneType) {
                                ContactsContract.CommonDataKinds.Phone.TYPE_MOBILE -> "Mobile"
                                ContactsContract.CommonDataKinds.Phone.TYPE_HOME -> "Home"
                                ContactsContract.CommonDataKinds.Phone.TYPE_WORK -> "Work"
                                ContactsContract.CommonDataKinds.Phone.TYPE_MAIN -> "Main"
                                ContactsContract.CommonDataKinds.Phone.TYPE_OTHER -> "Other"
                                ContactsContract.CommonDataKinds.Phone.TYPE_CUSTOM -> if (!customLabel.isNullOrBlank()) customLabel else "Other"
                                else -> "Mobile"
                            }

                            val cleanNumber = rawNumber.trim()
                            if (cleanNumber.isEmpty()) continue

                            val entry = contactsMap.getOrPut(contactId) {
                                ContactEntry(
                                    id = contactId,
                                    name = if (!displayName.isNullOrBlank()) displayName else cleanNumber,
                                    avatar = avatar
                                )
                            }

                            if (entry.avatar.isEmpty() && avatar.isNotEmpty()) {
                                entry.avatar = avatar
                            }

                            // Avoid duplicate numbers for this contact
                            val isDuplicate = entry.phoneNumbers.any {
                                it.number.replace("\\s+".toRegex(), "") == cleanNumber.replace("\\s+".toRegex(), "")
                            }
                            if (!isDuplicate) {
                                entry.phoneNumbers.add(PhoneNumberEntry(label = label, number = cleanNumber))
                            }
                        }
                    }
                } finally {
                    phoneCursor?.close()
                }

                // Query Emails for contacts in contactsMap
                try {
                    val emailProjection = arrayOf(
                        ContactsContract.CommonDataKinds.Email.CONTACT_ID,
                        ContactsContract.CommonDataKinds.Email.DATA
                    )
                    var emailCursor: Cursor? = null
                    try {
                        emailCursor = contentResolver.query(
                            ContactsContract.CommonDataKinds.Email.CONTENT_URI,
                            emailProjection,
                            null,
                            null,
                            null
                        )
                        if (emailCursor != null) {
                            val emailIdIdx = emailCursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.CONTACT_ID)
                            val emailDataIdx = emailCursor.getColumnIndex(ContactsContract.CommonDataKinds.Email.DATA)

                            while (emailCursor.moveToNext()) {
                                val cId = if (emailIdIdx >= 0) emailCursor.getString(emailIdIdx) else null ?: continue
                                val emailStr = if (emailDataIdx >= 0) emailCursor.getString(emailDataIdx) else null
                                if (!emailStr.isNullOrBlank()) {
                                    val entry = contactsMap[cId]
                                    if (entry != null && entry.email.isEmpty()) {
                                        entry.email = emailStr.trim()
                                    }
                                }
                            }
                        }
                    } finally {
                        emailCursor?.close()
                    }
                } catch (ignored: Exception) {}

                // Convert to React Native WritableArray
                val resultArray: WritableArray = Arguments.createArray()
                for (entry in contactsMap.values) {
                    val map: WritableMap = Arguments.createMap()
                    map.putString("id", entry.id)
                    map.putString("name", entry.name)
                    map.putString("avatar", entry.avatar)
                    val primary = if (entry.phoneNumbers.isNotEmpty()) entry.phoneNumbers[0].number else ""
                    map.putString("primaryPhone", primary)
                    map.putString("email", entry.email)
                    map.putBoolean("hasApp", true)

                    val phonesArray: WritableArray = Arguments.createArray()
                    for (p in entry.phoneNumbers) {
                        val pMap: WritableMap = Arguments.createMap()
                        pMap.putString("label", p.label)
                        pMap.putString("number", p.number)
                        phonesArray.pushMap(pMap)
                    }
                    map.putArray("phoneNumbers", phonesArray)

                    resultArray.pushMap(map)
                }

                promise.resolve(resultArray)
            } catch (e: Exception) {
                promise.reject("E_CONTACTS_ERROR", e.message ?: "Failed to fetch contacts", e)
            }
        }.start()
    }

    private class ContactEntry(
        val id: String,
        var name: String,
        var avatar: String = "",
        var email: String = "",
        val phoneNumbers: MutableList<PhoneNumberEntry> = mutableListOf()
    )

    private class PhoneNumberEntry(
        val label: String,
        val number: String
    )
}

