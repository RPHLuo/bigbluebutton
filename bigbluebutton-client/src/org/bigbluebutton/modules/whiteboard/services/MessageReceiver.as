/**
 * BigBlueButton open source conferencing system - http://www.bigbluebutton.org/
 * 
 * Copyright (c) 2012 BigBlueButton Inc. and by respective authors (see below).
 *
 * This program is free software; you can redistribute it and/or modify it under the
 * terms of the GNU Lesser General Public License as published by the Free Software
 * Foundation; either version 3.0 of the License, or (at your option) any later
 * version.
 * 
 * BigBlueButton is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along
 * with BigBlueButton; if not, see <http://www.gnu.org/licenses/>.
 *
 */
package org.bigbluebutton.modules.whiteboard.services
{
  import org.as3commons.logging.api.ILogger;
  import org.as3commons.logging.api.getClassLogger;
  import org.bigbluebutton.core.BBB;
  import org.bigbluebutton.main.model.users.IMessageListener;
  import org.bigbluebutton.modules.whiteboard.business.shapes.DrawObject;
  import org.bigbluebutton.modules.whiteboard.models.Annotation;
  import org.bigbluebutton.modules.whiteboard.models.WhiteboardModel;

  public class MessageReceiver implements IMessageListener
  {
	private static const LOGGER:ILogger = getClassLogger(MessageReceiver);
    
        /* Injected by Mate */
    public var whiteboardModel:WhiteboardModel;
    
    public function MessageReceiver() {
      BBB.initConnectionManager().addMessageListener(this);
    }

    public function onMessage(messageName:String, message:Object):void {
      // trace("WB: received message " + messageName);

      switch (messageName) {
        case "GetWhiteboardAnnotationsRespMsg":
          handleGetWhiteboardAnnotationsRespMsg(message);
          break;
        case "GetWhiteboardAccessRespMsg":
          handleGetWhiteboardAccessRespMsg(message);
          break;
        case "ModifyWhiteboardAccessEvtMsg":
          handleModifyWhiteboardAccessEvtMsg(message);
          break;
        case "SendWhiteboardAnnotationEvtMsg":
          handleSendWhiteboardAnnotationEvtMsg(message);
          break;  
        case "ClearWhiteboardEvtMsg":
          handleClearWhiteboardEvtMsg(message);
          break;
        case "UndoWhiteboardEvtMsg":
          handleUndoWhiteboardEvtMsg(message);
          break;
        case "SendCursorPositionEvtMsg":
          handleSendCursorPositionEvtMsg(message);
          break;
        default:
//          LogUtil.warn("Cannot handle message [" + messageName + "]");
      }
    }

    private function handleClearWhiteboardEvtMsg(message:Object):void {
      if (message.body.hasOwnProperty("whiteboardId") && message.body.hasOwnProperty("fullClear") 
        && message.body.hasOwnProperty("userId")) {
        whiteboardModel.clear(message.body.whiteboardId, message.body.fullClear, message.body.userId);
      }
    }

    private function handleUndoWhiteboardEvtMsg(message:Object):void {
      if (message.body.hasOwnProperty("whiteboardId") && message.body.hasOwnProperty("annotationId")) {
        whiteboardModel.removeAnnotation(message.body.whiteboardId, message.body.annotationId);
      }
    }

    private function handleModifyWhiteboardAccessEvtMsg(message:Object):void {
      whiteboardModel.accessModified(message.body.multiUser);
    }
    
    private function handleGetWhiteboardAccessRespMsg(message:Object):void {
      whiteboardModel.accessModified(message.body.multiUser);
    }
    
    private function handleSendWhiteboardAnnotationEvtMsg(message:Object):void {
      var receivedAnnotation:Object = message.body.annotation;
      
      var annotation:Annotation = new Annotation(receivedAnnotation.id, receivedAnnotation.annotationType, receivedAnnotation.annotationInfo);
      annotation.status = receivedAnnotation.status;
      annotation.userId = receivedAnnotation.userId;
      whiteboardModel.addAnnotation(annotation);
    }

    private function handleGetWhiteboardAnnotationsRespMsg(message:Object):void {
      var whiteboardId:String = message.body.whiteboardId;
      var annotations:Array = message.body.annotations as Array;
      var tempAnnotations:Array = new Array();
      
      for (var i:int = 0; i < annotations.length; i++) {
        var an:Object = annotations[i] as Object;
        var annotation:Annotation = new Annotation(an.id, an.annotationType, an.annotationInfo);
        annotation.status = an.status;
        annotation.userId = an.userId;
        tempAnnotations.push(annotation);
      }
      
      whiteboardModel.addAnnotationFromHistory(whiteboardId, tempAnnotations);
    }
    
    private function handleSendCursorPositionEvtMsg(message:Object):void {
      var userId:String = message.header.userId as String;
      var xPercent:Number = message.body.xPercent as Number;
	  var yPercent:Number = message.body.yPercent as Number;
      
      whiteboardModel.updateCursorPosition(userId, xPercent, yPercent);
    }
  }
}
