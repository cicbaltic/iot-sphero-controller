var sphero = require("sphero");
var orb = sphero("/dev/rfcomm0");

orb.connect(function() {
    console.log("connected");
});


orb.on("ready", function() {
    orb.detectCollisions();

    orb.on("collision", function(data) {
      console.log("data:");
      console.log("  x:", data.x);
      console.log("  y:", data.y);
      console.log("  z:", data.z);
      console.log("  axis:", data.axis);
      console.log("  xMagnitud:", data.xMagnitud);
      console.log("  yMagnitud:", data.yMagnitud);
      console.log("  speed:", data.timeStamp);
      console.log("  timeStamp:", data.timeStamp);

      console.log("\n");
      console.log(data);
    });
});
