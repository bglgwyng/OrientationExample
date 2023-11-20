package com.orientationexample.frameprocessors

import android.annotation.SuppressLint
import android.graphics.Rect
import android.os.Build
import androidx.annotation.RequiresApi
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.mrousavy.camera.frameprocessor.Frame
import com.mrousavy.camera.frameprocessor.FrameProcessorPlugin

class FaceDetectorPlugin(options: MutableMap<String, Any>?) : FrameProcessorPlugin(options) {
    private var detectorOptions = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
        .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE).setMinFaceSize(0.25f)
        .enableTracking().build()
    private var faceDetector = FaceDetection.getClient(detectorOptions)

    private fun processBoundingBox(boundingBox: Rect): Map<String, Double> {
        return mapOf(
            "top" to boundingBox.top.toDouble(),
            "left" to boundingBox.left.toDouble(),
            "width" to boundingBox.width().toDouble(),
            "height" to boundingBox.height().toDouble()
        )
    }


    @RequiresApi(Build.VERSION_CODES.S)
    override fun callback(
        frame: Frame, params: MutableMap<String, Any>?
    ): ArrayList<Map<String, Any>> {

        try {
            @SuppressLint("UnsafeOptInUsageError") val mediaImage = frame.image
            val orientation = Orientation.fromInt(
                (params!!["orientation"] as Double).toInt()
            )

            if (orientation.isMirrored()) {
                throw Exception("Mirrored orientation is not supported")
            }

            val rotationDegrees = orientation.toRotationDegrees()

            if (mediaImage == null) {
                return arrayListOf()
            }

            val image = InputImage.fromMediaImage(mediaImage, (360 - rotationDegrees) % 360)
            val task = faceDetector.process(image)
            val faces = Tasks.await(task)
            return faces.map {
                return@map mapOf<String, Any>(
                    "rollAngle" to it.headEulerAngleZ.toDouble(),
                    "pitchAngle" to it.headEulerAngleX.toDouble(),
                    "yawAngle" to it.headEulerAngleY.toDouble(),
                    "bounds" to processBoundingBox(it.boundingBox),
                    "trackingId" to it.trackingId!!
                )
            }.toCollection(ArrayList())
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return arrayListOf()
    }
}


enum class Orientation(val i: Int) {
    up(1),
    upMirrored(2),
    down(3),
    downMirrored(4),
    left(6),
    leftMirrored(5),
    right(8),
    rightMirrored(7);

    companion object {
        fun fromDeviceOrientation(value: com.mrousavy.camera.types.Orientation)
                = when(value) {
            com.mrousavy.camera.types.Orientation.PORTRAIT -> up
            com.mrousavy.camera.types.Orientation.LANDSCAPE_LEFT -> left
            com.mrousavy.camera.types.Orientation.LANDSCAPE_RIGHT -> right
            com.mrousavy.camera.types.Orientation.PORTRAIT_UPSIDE_DOWN -> down
        }
        fun fromInt(value: Int) = values().first { it.i == value }
    }

    fun isMirrored(): Boolean {
        return when (this) {
            upMirrored -> true
            downMirrored -> true
            leftMirrored -> true
            rightMirrored -> true
            else -> false
        }
    }

    fun toRotationDegrees(): Int {
        return when (this) {
            up -> 0
            upMirrored -> 0
            down -> 180
            downMirrored -> 180
            left -> 270
            leftMirrored -> 270
            right -> 90
            rightMirrored -> 90
        }
    }
}
