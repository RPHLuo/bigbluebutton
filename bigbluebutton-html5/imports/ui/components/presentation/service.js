import WhiteboardMultiUser from '/imports/api/2.0/whiteboard-multi-user/';
import Presentations from '/imports/api/2.0/presentations';
import Slides from '/imports/api/2.0/slides';
import Users from '/imports/api/2.0/users';
import Auth from '/imports/ui/services/auth';

const getCurrentPresentation = () => Presentations.findOne({
  current: true,
});

const getCurrentSlide = () => {
  const currentPresentation = getCurrentPresentation();

  if (!currentPresentation) {
    return null;
  }

  return Slides.findOne(
    {
      presentationId: currentPresentation.id,
      current: true,
    },
    {
      fields: {
        meetingId: 0,
        thumbUri: 0,
        swfUri: 0,
        txtUri: 0,
        svgUri: 0,
      },
    },
  );
};

const isPresenter = () => {
  const currentUser = Users.findOne({ userId: Auth.userID });
  return currentUser ? currentUser.presenter : false;
};

const getMultiUserStatus = () => {
  const data = WhiteboardMultiUser.findOne({ meetingId: Auth.meetingID });
  return data ? data.multiUser : false;
};

export default {
  getCurrentPresentation,
  getCurrentSlide,
  isPresenter,
  getMultiUserStatus,
};
