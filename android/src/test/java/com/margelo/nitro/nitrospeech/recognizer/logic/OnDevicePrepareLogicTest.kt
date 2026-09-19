package com.margelo.nitro.nitrospeech.recognizer.logic

import org.junit.Assert.assertEquals
import org.junit.Test

class OnDevicePrepareLogicTest {
  @Test
  fun preferFallsBackWhenServiceMissing() {
    assertEquals(
      OnDevicePrepareLogic.Decision.UseFallback,
      OnDevicePrepareLogic.beforeDownload(
        serviceAvailable = false,
        requireOnDevice = false,
        apiLevel = 34,
        localeInstalled = false,
      ),
    )
  }

  @Test
  fun requireFailsWhenServiceMissing() {
    assertEquals(
      OnDevicePrepareLogic.Decision.NotSupported,
      OnDevicePrepareLogic.beforeDownload(
        serviceAvailable = false,
        requireOnDevice = true,
        apiLevel = 34,
        localeInstalled = false,
      ),
    )
  }

  @Test
  fun apiBelow33UsesOnDeviceWithoutPackCheck() {
    assertEquals(
      OnDevicePrepareLogic.Decision.UseOnDevice,
      OnDevicePrepareLogic.beforeDownload(
        serviceAvailable = true,
        requireOnDevice = true,
        apiLevel = 32,
        localeInstalled = false,
      ),
    )
  }

  @Test
  fun installedLocaleUsesOnDevice() {
    assertEquals(
      OnDevicePrepareLogic.Decision.UseOnDevice,
      OnDevicePrepareLogic.beforeDownload(
        serviceAvailable = true,
        requireOnDevice = true,
        apiLevel = 33,
        localeInstalled = true,
      ),
    )
  }

  @Test
  fun missingPackNeedsDownload() {
    assertEquals(
      OnDevicePrepareLogic.Decision.NeedsDownload,
      OnDevicePrepareLogic.beforeDownload(
        serviceAvailable = true,
        requireOnDevice = false,
        apiLevel = 33,
        localeInstalled = false,
      ),
    )
  }

  @Test
  fun afterDownloadSuccessUsesOnDevice() {
    assertEquals(
      OnDevicePrepareLogic.Decision.UseOnDevice,
      OnDevicePrepareLogic.afterDownload(
        requireOnDevice = true,
        downloadSucceeded = true,
        localeInstalled = false,
      ),
    )
  }

  @Test
  fun afterDownloadInstalledUsesOnDevice() {
    assertEquals(
      OnDevicePrepareLogic.Decision.UseOnDevice,
      OnDevicePrepareLogic.afterDownload(
        requireOnDevice = false,
        downloadSucceeded = false,
        localeInstalled = true,
      ),
    )
  }

  @Test
  fun afterFailedDownloadPreferFallsBack() {
    assertEquals(
      OnDevicePrepareLogic.Decision.UseFallback,
      OnDevicePrepareLogic.afterDownload(
        requireOnDevice = false,
        downloadSucceeded = false,
        localeInstalled = false,
      ),
    )
  }

  @Test
  fun afterFailedDownloadRequireErrors() {
    assertEquals(
      OnDevicePrepareLogic.Decision.ModelNotInstalled,
      OnDevicePrepareLogic.afterDownload(
        requireOnDevice = true,
        downloadSucceeded = false,
        localeInstalled = false,
      ),
    )
  }
}
