// Publish logged-in user's collaborations so client-side checks can work.
// This is how alanning:roles does it, too.
Meteor.publish("/collaborations/user", function () {
  if (!this.userId) {
    this.ready();
    return;
  }

  return Meteor.users.find({_id: this.userId}, {
    fields: { collaborations: 1 }
  });
});




function getDefaultCollabs (user) {
  var email_address;
  if (user.emails) {
    email_address = user.emails[0].address;
  } else if (user.services && user.services.google) {
    email_address = user.services.google.email;
  } else {
    throw new Meteor.Error("Don't know where to find email.");
  }

  var personal = email_address;

  return {
    email_address: email_address,
    personal: personal,
    memberOf: [ personal ],
  };
}

// Accounts.onCreateUser is called each time a user is created. This code
// ensures that user.collaborations is setup correctly.
Accounts.onCreateUser(function (options, user) {
  user.collaborations = getDefaultCollabs(user);

  // We still want the default hook's 'profile' behavior.
  if (options.profile) {
    user.profile = options.profile;
  }

  return user;
});

// make absolutely sure user.collaborations is set
// NOTE: some users will have a collaborations list under
// user.profile.collaborations or user.collaborations (directly), but there
// is no migration code because this list is dependant on the Collaborations
// collection, not the other way around.
Accounts.onLogin(function (loginObj) {
  var user = loginObj.user;
  var collabs = user.collaborations;
  // also check "email_address" and "personal" just in case
  // (memberOf is set during `getCollaborations`, so we don't technically
  // need that one)
  if (!collabs || Array.isArray(collabs)
      || !collabs.email_address || !collabs.personal) {
    Meteor.users.update(user._id, {
      $set: {
        collaborations: getDefaultCollabs(user),
      }
    });
  }
});



// set up some stuff so that the reset password emails don't look like
// they're coming from ROOT_URL (0.0.0.0/app-name)
/*
Accounts.emailTemplates.resetPassword.from = function () {
  return "MedBook Admin <ucscmedbook@gmail.com>";
}
Accounts.emailTemplates.resetPassword.subject = function (user) {
  return "Reset your MedBook password";
};
Accounts.emailTemplates.resetPassword.text = function (user, token) {
  var worldUrl = process.env.WORLD_URL;
  if (!worldUrl) {
    worldUrl = "WORLD_URL_ENV_NOT_SET";
  }

  var text = "Hello,"
  text += "\n\nA request was made to reset your MedBook password.";
  text += "\n\nClick here to reset your password using our secure server: ";
  text += token.replace("http", "https").replace("0.0.0.0:8000", worldUrl);
  text += "\n\nIf you did not request to reset your password you " +
      "can safely ignore this email.";
  text += "\n\nHave a great day,\n\nThe MedBook Team";

  return text;
};
*/
