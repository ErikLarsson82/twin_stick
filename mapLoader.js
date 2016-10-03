define('mapLoader', [
  'Box2D',
  'underscore'
], function (_Box2D, _) {

  // short hands
  var b2Vec2 = Box2D.Common.Math.b2Vec2;
  var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
  var b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;
  var b2PrismaticJointDef = Box2D.Dynamics.Joints.b2PrismaticJointDef;
  var b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef;

  var bodyDef = new Box2D.Dynamics.b2BodyDef();
  var fixDef = new Box2D.Dynamics.b2FixtureDef();

  return {
    // conventions:
    // body.name = 'startPos[playerIndex]'
    // body.name = 'endPos'
    loadJson: function (world, map, offset) {
      var offset = offset || {x: 0, y: 0};

      var mapObjects = [];
      var data = map; //TODO
      data.body = data.body || [];
      data.joint = data.joint || [];

      _.each(_.range(data.body.length), function(v, i) {

        var bodyData = data.body[i];
        bodyDef.type = bodyData.type; // 0 = static, 1 = kinematic, 2 = dynamic
        if (bodyData.position === 0) bodyData.position = {x: 0, y: 0};
        bodyDef.position.x = bodyData.position.x + offset.x;
        bodyDef.position.y = bodyData.position.y + offset.y;
        bodyDef.angle = bodyData.angle;
        bodyDef.awake = bodyData.awake || false;

        var body = world.CreateBody(bodyDef);
        body.SetUserData(bodyData.customProperties);
        body.name = bodyData.name;

        mapObjects.push(body);

        if (bodyData.fixture) {
          for (var j = 0; j < bodyData.fixture.length; j++) {
            var fixtureData = bodyData.fixture[j];

            if (fixtureData.polygon) {

              var vectors = [];

              var verticesX = fixtureData.polygon.vertices.x;
              var verticesY = fixtureData.polygon.vertices.y;

              for (var k = 0; k < verticesX.length; k++) {

                vectors.push(new b2Vec2(verticesX[k], verticesY[k]));

              }

              fixDef.shape = new b2PolygonShape();
              fixDef.shape.SetAsArray(vectors);

            } else if (fixtureData.circle) {

              fixDef.shape = new b2CircleShape(fixtureData.circle.radius);
              fixDef.shape.SetLocalPosition(new b2Vec2(fixtureData.circle.center.x, fixtureData.circle.center.y));

            }

            fixDef.friction = fixtureData.friction;
            fixDef.density = fixtureData.density;
            fixDef.restitution = fixtureData.restitution;
            fixDef.isSensor = fixtureData.sensor;
            fixDef.filter.categoryBits = fixtureData['filter-categoryBits'] || 1;
            fixDef.filter.maskBits = fixtureData['filter-maskBits'] || 65535;

            body.CreateFixture(fixDef);
          }
        }
      });

      for (var i = 0; i < data.joint.length; i++) {

        var jointData = data.joint[i];

        if (jointData.type === 'revolute') {

          var bodyA = mapObjects[jointData.bodyA];
          var bodyB = mapObjects[jointData.bodyB];

          var jointDef = new b2RevoluteJointDef();

          var pos = bodyA.GetPosition();
          pos.x = pos.x + offset.x;
          pos.y = pos.y + offset.y;
          jointDef.Initialize(bodyA, bodyB, pos);

          jointDef.enableLimit = jointData.enableLimit;
          jointDef.lowerAngle = jointData.lowerLimit;
          jointDef.upperAngle = jointData.upperLimit;

          jointDef.enableMotor = jointData.enableMotor;
          jointDef.maxMotorTorque = jointData.maxMotorTorque;
          jointDef.motorSpeed = jointData.motorSpeed;
          jointDef.localAnchorA = jointData.anchorA || new b2Vec2(0, 0);
          jointDef.localAnchorB = jointData.anchorB || new b2Vec2(0, 0);

          var joint = world.CreateJoint(jointDef);
          joint.name = jointData.name;

        } else if (jointData.type === 'prismatic') {

          var bodyA = mapObjects[jointData.bodyA];
          var bodyB = mapObjects[jointData.bodyB];

          var jointDef = new b2PrismaticJointDef();

          var axis = jointData.localAxisA || new b2Vec2(0, 0);
          jointDef.Initialize(bodyA, bodyB, bodyA.GetPosition(), axis);

          jointDef.enableLimit = jointData.enableLimit;
          jointDef.lowerTranslation = jointData.lowerLimit;
          jointDef.upperTranslation = jointData.upperLimit;

          jointDef.enableMotor = jointData.enableMotor;
          jointDef.maxMotorForce = jointData.maxMotorForce;
          jointDef.motorSpeed = jointData.motorSpeed;
          jointDef.localAnchorA = jointData.anchorA || new b2Vec2(0, 0);
          jointDef.localAnchorB = jointData.anchorB || new b2Vec2(0, 0);

          var joint = world.CreateJoint(jointDef);
          joint.name = jointData.name;
        } else if (jointData.type === 'distance') {

          var jointDef = new b2DistanceJointDef();

          jointDef.bodyA = mapObjects[jointData.bodyA];
          jointDef.bodyB = mapObjects[jointData.bodyB];
          jointDef.length = jointData.length;
          jointDef.dampingRatio = jointData.dampingRatio;
          jointDef.frequencyHz = jointData.frequency;
          jointDef.localAnchorA = jointData.anchorA || new b2Vec2(0, 0);
          jointDef.localAnchorB = jointData.anchorB || new b2Vec2(0, 0);

          var joint = world.CreateJoint(jointDef);
          joint.name = jointData.name;
        }
      }

    }
  };
});