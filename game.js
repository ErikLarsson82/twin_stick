define('game', [
    'Box2D',
    'underscore',
    'mapLoader',
    'userInput',
    'json!map1.json'
], function (
    _box2d,
    _,
    mapLoader,
    userInput,
    map1
) {
    // 144 and 1.0 or 60 and 2.4
    const FPS = 60;
    const impulseModifier = 2.4;

    let world = null;
    const gameObjects = [];
    window.gameObjects = gameObjects;

    const delta = 1.0/FPS;

    var DEBUG_WRITE_BUTTONS = false;

    var player1, player2, powerup, debree;

    class GameObject {
        constructor(world, body) {
            this.world = world;
            this.body = body;
            this.markedForRemoval = false;
        }
        tick() {}
        draw() {}
        removeIfApplicable() {
            if (this.markedForRemoval) this.world.DestroyBody(this.body);
        }
    }

    function debugWriteButtons(pad) {
        if (!DEBUG_WRITE_BUTTONS) return;
        _.each(pad && pad.buttons, function(button, idx) {
            if (button.pressed) console.log(idx + " pressed");
        })
    }

    class Player extends GameObject {
        constructor(world, body, id, color) {
            super(world, body);
            this.id = id;
            this.color = color;
            this.power = 0;
        }
        tick() {
            var pad = userInput.readInput()[this.id];
            debugWriteButtons(pad);
            applyPlayerForces(pad, this.body);

            var players = [
                player1,
                player2
            ]
            if (determineContact(players[this.id], powerup)) {
                this.power += 0.3;
            }
            if (determineContact(players[this.id], debree) && this.power >= 25) {
                debree.markedForRemoval = true;
                this.power = 0;
            }
            this.power = Math.min(25, Math.max(this.power, 0))
        }
        draw() {
            context.fillStyle = this.color;
            const pos = convertToScreenCoordinates(this.body.GetPosition());
            const size = this.power;
            context.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        }
    }

    function convertToScreenCoordinates(pos) {
        return {
            x: pos.x * 45,
            y: pos.y * -45
        }
    }

    function applyPlayerForces(pad, body) {
        if (!(pad && pad.axes && pad.axes[2] && pad.axes[3])) return;

        const thrust = 0.02;
        body.ApplyImpulse(new b2Vec2(pad.axes[0] * thrust * impulseModifier,
             pad.axes[1] * thrust * -1 * impulseModifier),
             body.GetWorldCenter());
    }

    function createAllGameObjects() {
        for (var b = world.m_bodyList; b; b = b.m_next) {
            if (b.name === "player1") {
                player1 = new Player(world, b, 0, "blue");
                gameObjects.push(player1);
                b.gameObject = player1;
            }
            if (b.name === "player2") {
                player2 = new Player(world, b, 1, "green");
                gameObjects.push(player2);
                b.gameObject = player2;
            }
            if (b.name === "powerup") {
                powerup = new GameObject(world, b);
                gameObjects.push(powerup);
                b.gameObject = powerup;
            }
            if (b.name === "debree") {
                debree = new GameObject(world, b);
                gameObjects.push(debree);
                b.gameObject = debree;
            }
        }
    }

    function determineContact(gameObject1, gameObject2) {
        return _.find(contacts, function(contactPair) {
            return (contactPair.a.gameObject === gameObject1 &&
                contactPair.b.gameObject === gameObject2) ||
                (contactPair.a.gameObject === gameObject2 &&
                contactPair.b.gameObject === gameObject1);
        });
    }
    window.determineContact = determineContact;

    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');

    var b2Vec2 = Box2D.Common.Math.b2Vec2;
    var b2BodyDef = Box2D.Dynamics.b2BodyDef;
    var b2Body = Box2D.Dynamics.b2Body;
    var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
    var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
    var b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef;
    var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

    var debugDraw = new Box2D.Dynamics.b2DebugDraw();
    debugDraw.SetSprite(context);
    debugDraw.SetDrawScale(45.0);
    debugDraw.SetFillAlpha(0.3);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit);

    var contactListener = new Box2D.Dynamics.b2ContactListener();
    var contacts = [];
    window.contacts = contacts;
    contactListener.BeginContact = function(contact) {
        function exists() {
            return _.find(contacts, function(contactPair) {
                return !((contact.m_fixtureA.GetBody() === contactPair.a &&
                    contact.m_fixtureB.GetBody() === contactPair.b) ||
                    (contact.m_fixtureA.GetBody() === contactPair.b &&
                    contact.m_fixtureB.GetBody() === contactPair.a));
            })
        }
        if (!exists()) {
            contacts.push({
                a: contact.m_fixtureA.GetBody(),
                b: contact.m_fixtureB.GetBody()
            });
        }
    };

    contactListener.EndContact = function(contact) {
        contacts = _.filter(contacts, function(contactPair) {
            return !(contact.m_fixtureA.GetBody() === contactPair.a &&
                    contact.m_fixtureB.GetBody() === contactPair.b);
        })
        window.contacts = contacts;
    };

    return {
        init: function() {
            world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 0), true);
            world.SetDebugDraw(debugDraw);
            world.SetContactListener(contactListener);

            mapLoader.loadMap(world, map1);

            createAllGameObjects();
        },
        tick: function() {

            _.each(gameObjects, function(gameObject) {
                gameObject.tick();
            });

            world.Step(delta, 4, 4);

            _.each(gameObjects, function(gameObject) {
                gameObject.removeIfApplicable();
            });

            context.fillStyle = "gray"
            context.fillRect(0, 0, 1024, 768)

            context.save()
            context.scale(1, -1);
            world.DrawDebugData();
            context.restore();

            _.each(gameObjects, function(gameObject) {
                gameObject.draw();
            });
        }
    }
});