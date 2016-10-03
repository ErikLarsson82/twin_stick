define('game', [
    'Box2D',
    'underscore',
    'mapLoader',
    'userInput',
    'json!map1.json',
    'json!ship1.json',
    'json!ship2.json'
], function (
    _box2d,
    _,
    mapLoader,
    userInput,
    map1,
    ship1,
    ship2
) {
    // 144 and 1.0 or 60 and 2.4
    const FPS = 144;
    const impulseModifier = 1;


    var DEBUG_WRITE_BUTTONS = true;
    var DEBUG_CONTROL_POINTS = false;
    var switchIt = false;

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
            return this.markedForRemoval;
        }
        markForRemove() {
            this.markedForRemoval = true;
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

            if (pad && pad.buttons && pad.buttons[4] && pad.buttons[4].pressed) {
                findBodyByName('player1') && findBodyByName('player1').gameObject.markForRemove();
                spawnPlayer(0, ship2);
                
            }

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
                this.body.ApplyImpulse(new b2Vec2(fixedVector[0] * -thrust * impulseModifier,
                     fixedVector[1] * thrust * impulseModifier),
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

    function createAllGameObjects(idx) {
        for (var b = world.m_bodyList; b; b = b.m_next) {
            if (b.name === "ship1" || b.name === "ship2") {
                b.name = "player1";
                var player = new Player(world, b, idx, "blue");
                b.gameObject = player;
                gameObjects.push(player);
            }
        }
    }

    function spawnPlayer(idx, ship) {
        mapLoader.loadJson(world, ship, findBodyByName('spawn1').GetPosition());
        createAllGameObjects(idx);
    }


    function findBodyByName(name) {
        var body;
        for (var b = world.m_bodyList; b; b = b.m_next) {
            if (b.name === name) {
                return b;
            }
        }
        return false;
    }
    window.findBodyByName = findBodyByName;

    let world = null;
    let gameObjects = [];

    const delta = 1.0/FPS;

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
            mapLoader.loadJson(world, map1);
            
            spawnPlayer(0, ship1);
        },
        tick: function() {

            _.each(gameObjects, function(gameObject) {
                gameObject.tick();
            });

            world.Step(delta, 4, 4);

            gameObjects = _.filter(gameObjects, function(gameObject) {
                return !gameObject.removeIfApplicable();
            });
            window.go = gameObjects;

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