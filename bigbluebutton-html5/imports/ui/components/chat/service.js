import Chats from '/imports/api/2.0/chat';
import Users from '/imports/api/2.0/users';
import Auth from '/imports/ui/services/auth';
import UnreadMessages from '/imports/ui/services/unread-messages';
import Storage from '/imports/ui/services/storage/session';
import mapUser from '/imports/ui/services/user/mapUser';
import { makeCall } from '/imports/ui/services/api';
import _ from 'lodash';

const CHAT_CONFIG = Meteor.settings.public.chat;
const GROUPING_MESSAGES_WINDOW = CHAT_CONFIG.grouping_messages_window;

const SYSTEM_CHAT_TYPE = CHAT_CONFIG.type_system;

const PUBLIC_CHAT_ID = CHAT_CONFIG.public_id;
const PUBLIC_CHAT_USERID = CHAT_CONFIG.public_userid;
const PUBLIC_CHAT_USERNAME = CHAT_CONFIG.public_username;

const ScrollCollection = new Mongo.Collection(null);

// session for closed chat list
const CLOSED_CHAT_LIST_KEY = 'closedChatList';

const getUser = (userID) => {
  const user = Users.findOne({ userId: userID });

  if (!user) {
    return null;
  }

  return mapUser(user);
};

const mapMessage = (messagePayload) => {
  const { message } = messagePayload;

  const mappedMessage = {
    id: messagePayload._id,
    content: messagePayload.content,
    time: message.fromTime, // + message.from_tz_offset,
    sender: null,
  };

  if (message.chat_type !== SYSTEM_CHAT_TYPE) {
    mappedMessage.sender = getUser(message.fromUserId, message.fromUsername);
  }

  return mappedMessage;
};

const reduceMessages = (previous, current) => {
  const lastMessage = previous[previous.length - 1];
  const currentPayload = current.message;

  const reducedMessages = current;

  reducedMessages.content = [];

  reducedMessages.content.push({
    id: current._id,
    text: currentPayload.message,
    time: currentPayload.fromTime,
  });

  if (!lastMessage || !reducedMessages.message.chatType === SYSTEM_CHAT_TYPE) {
    return previous.concat(reducedMessages);
  }

  const lastPayload = lastMessage.message;

  // Check if the last message is from the same user and time discrepancy
  // between the two messages exceeds window and then group current message
  // with the last one

  if (lastPayload.fromUserId === currentPayload.fromUserId
    && (currentPayload.fromTime - lastPayload.fromTime) <= GROUPING_MESSAGES_WINDOW) {
    lastMessage.content.push(reducedMessages.content.pop());
    return previous;
  }
  return previous.concat(reducedMessages);
};

const reducedPublicMessages = publicMessages =>
  (publicMessages.reduce(reduceMessages, []).map(mapMessage));

const getPrivateMessages = (userID) => {
  const messages = Chats.find({
    'message.toUsername': { $ne: PUBLIC_CHAT_USERNAME },
    $or: [
      { 'message.toUserId': userID },
      { 'message.fromUserId': userID },
    ],
  }, {
    sort: ['message.fromTime'],
  }).fetch();

  return messages.reduce(reduceMessages, []).map(mapMessage);
};

const isChatLocked = (receiverID) => {
  const isPublic = receiverID === PUBLIC_CHAT_ID;
  const currentUser = getUser(Auth.userID);

  const lockSettings = false;

  // FIX ME
  /* meeting.roomLockSettings || {
    disablePublicChat: false,
    disablePrivateChat: false,
  }; */

  if (!currentUser.isLocked || currentUser.isPresenter) {
    return false;
  }

  return isPublic ? lockSettings.disablePublicChat : lockSettings.disablePrivateChat;
};

const hasUnreadMessages = (receiverID) => {
  const isPublic = receiverID === PUBLIC_CHAT_ID;
  const chatType = isPublic ? PUBLIC_CHAT_USERID : receiverID;

  return UnreadMessages.count(chatType) > 0;
};

const lastReadMessageTime = (receiverID) => {
  const isPublic = receiverID === PUBLIC_CHAT_ID;
  const chatType = isPublic ? PUBLIC_CHAT_USERID : receiverID;

  return UnreadMessages.get(chatType);
};

const sendMessage = (receiverID, message) => {
  const isPublic = receiverID === PUBLIC_CHAT_ID;

  const sender = getUser(Auth.userID);
  const receiver = !isPublic ? getUser(receiverID) : {
    id: PUBLIC_CHAT_USERID,
    name: PUBLIC_CHAT_USERNAME,
  };

  /* FIX: Why we need all this payload to send a message?
   * The server only really needs the message, from_userid, to_userid and from_lang
   */
  const messagePayload = {
    message,
    fromUserId: sender.id,
    fromUsername: sender.name,
    fromTimezoneOffset: (new Date()).getTimezoneOffset(),
    toUsername: receiver.name,
    toUserId: receiver.id,
    fromTime: Date.now(),
    fromColor: 0,
  };

  const currentClosedChats = Storage.getItem(CLOSED_CHAT_LIST_KEY);

  // Remove the chat that user send messages from the session.
  if (_.indexOf(currentClosedChats, receiver.id) > -1) {
    Storage.setItem(CLOSED_CHAT_LIST_KEY, _.without(currentClosedChats, receiver.id));
  }

  return makeCall('sendChat', messagePayload);
};

const getScrollPosition = (receiverID) => {
  const scroll = ScrollCollection.findOne({ receiver: receiverID }) || { position: null };
  return scroll.position;
};

const updateScrollPosition =
  (receiverID, position) => ScrollCollection.upsert(
    { receiver: receiverID },
    { $set: { position } },
  );

const updateUnreadMessage = (receiverID, timestamp) => {
  const isPublic = receiverID === PUBLIC_CHAT_ID;
  const chatType = isPublic ? PUBLIC_CHAT_USERID : receiverID;
  return UnreadMessages.update(chatType, timestamp);
};

const clearPublicChatHistory = () => (makeCall('clearPublicChatHistory'));

const closePrivateChat = (chatID) => {
  const currentClosedChats = Storage.getItem(CLOSED_CHAT_LIST_KEY) || [];

  if (_.indexOf(currentClosedChats, chatID) < 0) {
    currentClosedChats.push(chatID);

    Storage.setItem(CLOSED_CHAT_LIST_KEY, currentClosedChats);
  }
};

// We decode to prevent HTML5 escaped characters.
const htmlDecode = (input) => {
  const e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes[0].nodeValue;
};

const formatTime = time => (time <= 9 ? `0${time}` : time);

// Export the chat as [Hour:Min] user : message
const exportChat = messageList => (
  messageList.map(({ message }) => {
    const date = new Date(message.fromTime);
    const hour = formatTime(date.getHours());
    const min = formatTime(date.getMinutes());
    const hourMin = `${hour}:${min}`;
    if (message.fromUserId === SYSTEM_CHAT_TYPE) {
      return `[${hourMin}] ${message.message}`;
    }
    return `[${hourMin}] ${message.fromUsername}: ${htmlDecode(message.message)}`;
  }).join('\n')
);

const getPublicMessages = () => {
  const publicMessages = Chats.find({
    'message.toUsername': { $in: [PUBLIC_CHAT_USERNAME, SYSTEM_CHAT_TYPE] },
  }, {
    sort: ['message.fromTime'],
  }).fetch();

  return publicMessages;
};

export default {
  reducedPublicMessages,
  getPublicMessages,
  getPrivateMessages,
  getUser,
  getScrollPosition,
  hasUnreadMessages,
  lastReadMessageTime,
  isChatLocked,
  updateScrollPosition,
  updateUnreadMessage,
  sendMessage,
  closePrivateChat,
  exportChat,
  clearPublicChatHistory,
};
