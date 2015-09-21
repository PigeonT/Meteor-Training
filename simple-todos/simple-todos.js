//Create mongodb collection
Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {

    Meteor.methods({
        addTask: function(text) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            };

            Tasks.insert({
                text: text,
                createAt: new Date(),
                owner: Meteor.userId(),
                username: Meteor.user().username
            });
        },
        deleteTask: function(taskId) {
            //Tasks.remove(taskId)
            var task = Tasks.findOne(taskId);
            if (task.private && task.owner !== Meteor.userId) {
                throw new Meteor.Error('not-authorized');
            };
            Tasks.remove(taskId);
        },
        setChecked: function(taskId, setChecked) {
            var task = Tasks.findOne(taskId);
            if (task.private && task.owner !== Meteor.userId) {
                throw new Meteor.Error('not-authorized');
            };


            Tasks.update(taskId, {
                $set: {
                    checked: setChecked
                }
            });
        },

        setPrivate: function(taskId, setToPrivate) {
            var task = Tasks.findOne(taskId);

            //debugger;
            //console.log("achor");

            if (task.owner !== Meteor.userId()) {
                throw new Meteor.Error("not-authorized")
            };

            //setToPrivate = setToPrivate ||  true;
            //setToPrivate = !setToPrivate;

            Tasks.update(
                taskId, {
                    $set: {
                        private: setToPrivate
                    }
                }
            );
        }
    });

    Meteor.publish("tasks", function() {
        return Tasks.find({
            $or: [{
                private: {
                    $ne: true
                }
            }, {
                owner: this.userId
            }]
        });
    });
}

if (Meteor.isClient) {

    Meteor.subscribe("tasks");

    Template.body.helpers({
        tasks: function() {
            if (Session.get("hideCompleted")) {
                return Tasks.find({
                    checked: {
                        $ne: true
                    }
                }, {
                    sort: {
                        createAt: -1
                    }
                })
            } else {
                return Tasks.find({}, {
                    sort: {
                        createAt: -1
                    }
                })
            }

        },

        hideCompleted: function() {
            return Session.get("hideComleted");
        },
        inCompleteCount: function() {
            return Tasks.find({
                checked: {
                    $ne: true
                }
            }).count();
        }
    });

    Template.body.events({
        "submit .new-task": function(event) {
            event.preventDefault();

            var text = event.target.text.value;
            Meteor.call("addTask", text);

            event.target.text.value = "";

        },
        "change .hide-completed input ": function(event) {
            Session.set("hideCompleted", event.target.checked);
        }

    });

    Template.task.helpers({
        isOwner: function() {
            return this.owner == Meteor.userId();
        }
    });
    Template.task.events({
        "click .toggle-checked": function() {
            Meteor.call("setChecked", this._id, !this.checked);
        },
        "click .delete": function() {
            Meteor.call("deleteTask", this._id);
        },
        "click .toggle-private": function() {
            Meteor.call("setPrivate", this._id, !this.private);
        }
    });

    
    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}


