define('game', [
    'Box2d', 
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
    var DEBUG_WRITE_BUTTONS = false;

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
            this.weightRatio = 1.0;
            this.turbo = false;
        }
        tick() {
            var pad = userInput.readInput()[this.id];
            debugWriteButtons(pad);
            if (pad && pad.buttons && pad.buttons[5] && pad.buttons[5].pressed) {
                if (this.weightRatio > 0) this.weightRatio = this.weightRatio - 0.01;
                this.turbo = (this.weightRatio > 0.3)
            } else {
                this.turbo = false;
                if (this.weightRatio < 1.0) this.weightRatio = this.weightRatio + 0.005;
            }
            let density = (this.turbo) ? 30 : 0.0001;
            for (var f = this.body.m_fixtureList; f; f = f.m_next) {
                f.SetDensity(density);
                this.body.ResetMassData()
            }
            applyPlayerForces(pad, this.body, this.turbo);
        }
        draw() {
            context.fillStyle = (this.turbo) ? "red" : this.color;
            const pos = convertToScreenCoordinates(this.body.GetPosition());
            const size = this.weightRatio * 25;
            context.fillRect(pos.x - size/2, pos.y - size/2, size, size);
        }
    }

    function convertToScreenCoordinates(pos) {
        return {
            x: pos.x * 45,
            y: pos.y * -45
        }
    }

    function applyPlayerForces(pad, body, turbo) {
        if (!(pad && pad.axes && pad.axes[2] && pad.axes[3])) return;

        let multiplier = (turbo) ? 10 : 0.00001;
        const desiredAngle = Math.atan2( pad.axes[2], pad.axes[3] ) - (Math.PI / 2);
        body.SetAngle(desiredAngle);

        body.ApplyImpulse(new b2Vec2(pad.axes[0] * multiplier,
             pad.axes[1] * multiplier * -1),
             body.GetWorldCenter());
    }

    function createAllGameObjects() {
        for (var b = world.m_bodyList; b; b = b.m_next) {
            if (b.name === "player1") {
                gameObjects.push(new Player(world, b, 0, "blue"));
            }
            if (b.name === "player2") {
                gameObjects.push(new Player(world, b, 1, "green"));
            }
        }
    }

    let world = null;
    const gameObjects = [];
    window.kurt = gameObjects
    
    const delta = 1.0/144;

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

    return {
        init: function() {
            world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, 0), true);

            world.SetDebugDraw(debugDraw);
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