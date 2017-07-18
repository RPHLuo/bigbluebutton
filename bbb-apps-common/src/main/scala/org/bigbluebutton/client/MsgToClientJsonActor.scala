package org.bigbluebutton.client

import akka.actor.{Actor, ActorLogging, Props}
import org.bigbluebutton.client.bus._
import org.bigbluebutton.common2.util.JsonUtil
import org.bigbluebutton.red5.client.messaging._


object MsgToClientJsonActor {
  def props(msgToClientGW: MsgToClientGW): Props =
    Props(classOf[MsgToClientJsonActor], msgToClientGW)
}

class MsgToClientJsonActor(msgToClientGW: MsgToClientGW) extends Actor with ActorLogging {

  def receive = {
    case msg: BroadcastMsgToMeeting => handleBroadcastMsg(msg)
    case msg: DirectMsgToClient => handleDirectMsg(msg)
    case msg: DisconnectClientMsg => handleDisconnectClientMsg(msg)
    case msg: DisconnectAllMeetingClientsMsg => hsndleDisconnectAllMeetingClientsMsg(msg)
  }


  def handleBroadcastMsg(msg: BroadcastMsgToMeeting): Unit = {
    println("Received BroadcastMsgToMeeting " + msg)
    val meetingId = msg.meetingId
    val msgName = msg.data.envelope.name
    val json = JsonUtil.toJson(msg.data.core)

    val broadcast = new BroadcastToMeetingMsg(meetingId, msgName, json)
    msgToClientGW.broadcastToMeeting(broadcast)
  }

  def handleDirectMsg(msg: DirectMsgToClient): Unit = {
    println("Received DirectMsgToClient " + msg)
    val meetingId = msg.meetingId
    val connId = msg.connId
    val msgName = msg.data.envelope.name
    val json = JsonUtil.toJson(msg.data.core)

    val direct = new DirectToClientMsg(meetingId, connId, msgName, json)
    msgToClientGW.directToClient(direct)
  }

  def handleDisconnectClientMsg(msg: DisconnectClientMsg): Unit = {
    println("Received DisconnectClientMsg " + msg)
    val meetingId = msg.meetingId
    val connId = msg.connId

    msgToClientGW.systemMessage(new CloseConnectionMsg(meetingId, connId))
  }

  def hsndleDisconnectAllMeetingClientsMsg(msg: DisconnectAllMeetingClientsMsg): Unit = {
    println("Received DisconnectAllMeetingClientsMsg " + msg)
    val meetingId = msg.meetingId

    msgToClientGW.systemMessage(new CloseMeetingAllConnectionsMsg(meetingId))
  }
}
