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
    world = null

    const delta = 1.0/144;

    let testBody = null

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
            world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(0, -10), true);

            world.SetDebugDraw(debugDraw);
            mapLoader.loadMap(world, map1);

        },
        tick: function() {
            var pad = userInput.readInput();

            if (pad && pad.buttons[4].pressed) {
                for (var b = world.m_bodyList; b; b = b.m_next) {
                    if (b.name === "body1") {
                        b.ApplyImpulse(new b2Vec2(Math.cos(20 * (Math.PI / 180)) * 10,
                                 Math.sin(20 * (Math.PI / 180)) * 10),
                                 b.GetWorldCenter());
                    }
                }
            }
            world.Step(delta, 4, 4);

            context.fillStyle = "gray"
            context.fillRect(0, 0, 1024, 768)

            context.save()
            context.scale(1, -1);
            world.DrawDebugData();
            context.restore();
        }
    }
});