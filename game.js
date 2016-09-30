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
    var DEBUG_CONTROL_POINTS = false;

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
            this.axes = [0,0];
            this.rotationVector = [0,0];
        }
        tick() {
            var pad = userInput.readInput()[this.id];
            debugWriteButtons(pad);
            
            if (!(pad && pad.axes && pad.axes[2] && pad.axes[3])) return;

            if (pad && pad.buttons && pad.buttons[5] && pad.buttons[5].pressed) {
                this.thrusting = true;
            } else {
                this.thrusting = false;
            }
            const divider = 100;
            const threshold = 0.5;
            const thrust = 0.05;
            this.axes[0] = pad.axes[2] * -1;
            this.axes[1] = pad.axes[3] * -1;
            this.rotationVector[0] = this.rotationVector[0] + (this.axes[0] - this.rotationVector[0]) / divider;
            this.rotationVector[1] = this.rotationVector[1] + (this.axes[1] - this.rotationVector[1]) / divider;
            const craftAngle = Math.atan2( this.rotationVector[0], this.rotationVector[1] )// - (Math.PI / 2);
            this.body.SetAngle(craftAngle);
            
            const fixedVector = [Math.cos(craftAngle - (Math.PI / 2)), Math.sin(craftAngle + (Math.PI / 2))];
            
            if (this.thrusting) {
                this.body.ApplyImpulse(new b2Vec2(fixedVector[0] * -thrust,
                     fixedVector[1] * thrust),
                     this.body.GetWorldCenter());
            }
        }
        draw() {
            context.fillStyle = this.color;
            const pos = convertToScreenCoordinates(this.body.GetPosition());
            const size = 17;
            if (this.thrusting) {
                context.fillRect(pos.x - size/2, pos.y - size/2, size, size);
            }
            if (!DEBUG_CONTROL_POINTS) return;
            context.fillStyle = "red"
            context.fillRect(pos.x + this.axes[0] * 30, pos.y + this.axes[1] * 30, 3, 3);
            context.fillStyle = "green"
            context.fillRect(pos.x + this.rotationVector[0] * 30, pos.y + this.rotationVector[1] * 30, 3, 3);
        }
    }

    function convertToScreenCoordinates(pos) {
        return {
            x: pos.x * 45,
            y: pos.y * -45
        }
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
            world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, -4), true);

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