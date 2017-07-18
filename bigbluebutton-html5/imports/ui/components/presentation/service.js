import Presentations from '/imports/api/2.0/presentations';
import Slides from '/imports/api/2.0/slides';
import Cursor from '/imports/api/2.0/cursor';
import Users from '/imports/api/2.0/users';
import Auth from '/imports/ui/services/auth';

const getCurrentPresentation = () => Presentations.findOne({
  'presentation.current': true,
});

const getCurrentSlide = () => {
  const currentPresentation = getCurrentPresentation();

  if (!currentPresentation) {
    return null;
  }

  return Slides.findOne({
    presentationId: currentPresentation.presentation.id,
    'slide.current': true,
  });
};

const getCurrentCursor = () => Cursor.findOne({});

const isPresenter = () => {
  const currentUser = Users.findOne({ userId: Auth.userID });

  if (currentUser && currentUser.user) {
    return currentUser.user.presenter;
  }

  return false;
};

export default {
  getCurrentPresentation,
  getCurrentSlide,
  getCurrentCursor,
  isPresenter,
};
