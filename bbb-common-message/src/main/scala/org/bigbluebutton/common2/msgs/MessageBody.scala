package org.bigbluebutton.common2.msgs

import org.bigbluebutton.common2.domain._

object MessageBody {

  case class UserEmojiStatusChangeReqMsgBody(userId: String, emoji: String)
  case class EjectUserFromMeetingReqMsgBody(userId: String, requesterId: String)


  case class ChangeUserStatusReqMsgBody(userId: String, status: String, value: String)
  case class ChangeUserRoleReqMsgBody(userId: String, role: String)
  case class AssignPresenterReqMsgBody(userId: String, requesterId: String)
  case class SetRecordingReqMsgBody(recording: Boolean, requesterId: String)
  case class GetRecordingStatusReqMsgBody(requesterId: String)
  case class AllowUserToShareDesktopReqMsgBody(userId: String)

  // Presentation Message Bodies







  //
  /** Event messages sent by Akka apps as result of receiving incoming messages ***/
  //

  ///////////////////////////////////////////
  // Out Message Bodies
  ///////////////////////////////////////////

  // Presentation Message Bodies


}
