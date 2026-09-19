package com.margelo.nitro.nitrospeech.recognizer.logic

import org.junit.Assert.assertEquals
import org.junit.Test

class PermissionMappingTest {
  @Test
  fun grantedWinsEvenIfRequested() {
    assertEquals(PermissionMapping.Status.GRANTED, PermissionMapping.from(true, true))
    assertEquals(PermissionMapping.Status.GRANTED, PermissionMapping.from(true, false))
  }

  @Test
  fun deniedAfterRequestWithoutGrant() {
    assertEquals(PermissionMapping.Status.DENIED, PermissionMapping.from(false, true))
  }

  @Test
  fun notRequestedWhenNeverAsked() {
    assertEquals(PermissionMapping.Status.NOT_REQUESTED, PermissionMapping.from(false, false))
  }
}
