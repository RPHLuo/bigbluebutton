import { check } from 'meteor/check';
import Presentations from '/imports/api/2.0/presentations';
import Logger from '/imports/startup/server/logger';

import addSlide from '/imports/api/2.0/slides/server/modifiers/addSlide';

const addSlides = (meetingId, presentationId, slides) => {
  const slidesAdded = [];

  slides.forEach((slide) => {
    slidesAdded.push(addSlide(meetingId, presentationId, slide));
  });

  return slidesAdded;
};

export default function addPresentation(meetingId, presentation) {
  check(presentation, Object);

  const selector = {
    meetingId,
    'presentation.id': presentation.id,
  };

  const modifier = {
    $set: {
      meetingId,
      'presentation.id': presentation.id,
      'presentation.name': presentation.name,
      'presentation.current': presentation.current,
      'presentation.downloadable': presentation.downloadable,
    },
  };

  const cb = (err, numChanged) => {
    if (err) {
      return Logger.error(`Adding presentation2x to collection: ${err}`);
    }

    addSlides(meetingId, presentation.id, presentation.pages);

    const { insertedId } = numChanged;
    if (insertedId) {
      return Logger.info(`Added presentation2x id=${presentation.id} meeting=${meetingId}`);
    }

    return Logger.info(`Upserted presentation2x id=${presentation.id} meeting=${meetingId}`);
  };

  return Presentations.upsert(selector, modifier, cb);
}
