kernel = {

  init: function(){
    this.canvas = $("#render");
    this.ctx = this.canvas[0].getContext("2d");
    this.debugCanvas = $("#debug");
    this.dctx = this.debugCanvas[0].getContext("2d");
  },

  getParams: function(){
    var out = {
      minRadius: parseInt($("#minRadius").val(), 10),
      maxRadius: parseInt($("#maxRadius").val(),10),
      maxSepDistance: parseInt($("#maxSepDistance").val(), 10),
      circleCount: parseInt($("#circleCount").val(), 10),
      contourRadius: parseInt($("#contourRadius").val(),10),
      contourColor: $("#contourColor").val(),
      circlesColor: $("#circlesColor").val()
    };


    this.circlesOffset = {x: out.contourRadius, y: out.contourRadius };

    out._maxDistance = out.contourRadius - out.maxSepDistance - out.minRadius;

    return out;
  },

  debugCompare: function(faCircle, circle, params){
    this.ctx.clearRect(0,0,params.contourRadius*2,params.contourRadius*2);
    this.ctx.strokeStyle = "black";
    this.drawCircle(faCircle,this.circlesOffset);              
    this.ctx.strokeStyle = "blue";
    this.drawCircle(circle,this.circlesOffset);              
  },

  generateCircleCloud: function(params){
    var circles = [];
    var offset = 0;
    var angleStep = Math.acos((2*Math.pow(params.contourRadius,2)-Math.pow(2*params.minRadius+params.maxSepDistance,2))/(2*Math.pow(params.contourRadius,2)));
    var firstArm = [];
    var lastArm = [];
    for(var a = 0 ; a <= Math.PI*2; a+= angleStep){
      offset = 0;
      var currentArm = [];
      var searchList = lastArm.concat(firstArm);

      //      console.log("NEW ARM =======================================>");

      createCircle:
        while(offset < params._maxDistance){
          //  console.log("NEW OFFSET ==+==");
          var circle = {};

          var maxRadius = this.getRandom(params.minRadius, params.maxRadius);
          circle.x = (offset+maxRadius)*Math.cos(a); 
          circle.y = (offset+maxRadius)*Math.sin(a);
          circle.radius = maxRadius;

          searchList:
            var searchList = circles.concat(currentArm);
            for(var c = 0; c < searchList.length; c++){
              var faCircle = searchList[c];
              var distance = Math.sqrt(Math.pow(Math.abs(faCircle.x-circle.x),2)+Math.pow(Math.abs(faCircle.y-circle.y),2)) - faCircle.radius - params.maxSepDistance;
              
              this.debugCompare(faCircle, circle, params); 
              if(distance < params.minRadius){
                offset = Math.sqrt(Math.pow(faCircle.x,2) + Math.pow(faCircle.y,2))+faCircle.radius;
                //console.log("NO HOPE", faCircle,circle);
                continue createCircle;
              } else if( distance > params.minRadius && distance < maxRadius){
                maxRadius = distance;
                circle.radius = maxRadius;
                this.debugCompare(faCircle, circle,params); 
                // console.log("Reducing Max RD", maxRadius,circle);
              } else {
                this.debugCompare(faCircle, circle,params); 
                //console.log("OK", distance);
              }
            }


            if(offset+circle.radius*2 > params._maxDistance && offset+params.minRadius*2 < params._maxDistance){
              circle.radius = (params._maxDistance - offset) / 2
            } else if( offset+params.minRadius*2 > params._maxDistance){
              break;
            }

            //circle.x = offset*Math.cos(a); 
            //circle.y = offset*Math.sin(a);
            this.ctx.strokeStyle = "green";
            this.drawCircle(circle,this.circlesOffset,true);
            var len = currentArm.push(circle);
            offset += circle.radius*2 + params.maxSepDistance;
        }
        if(a === 0){
          firstArm = currentArm;
        } else {
          lastArm = currentArm;
        }
        circles = circles.concat(currentArm);
    }

    return circles;
  },

  drawCircle: function(circle,offset,debugctx){
    offset = offset || {x:0,y:0};
    var ctx = debugctx ? this.dctx : this.ctx;
    ctx.beginPath(); 
    ctx.arc(circle.x+offset.x,circle.y+offset.y,circle.radius,0, 2*Math.PI, false);
    ctx.stroke();
    ctx.closePath();
  },

  render: function(){
    var params = this.getParams();
    var circleCloud = this.generateCircleCloud(params);
    this.canvas.attr({
      height: params.contourRadius*2,
      width: params.contourRadius*2
    });

    this.ctx.clearRect(0,0,params.contourRadius*2,params.contourRadius*2);
    this.ctx.strokeStyle = params.circlesColor;

    for(var c in circleCloud){
      circle = circleCloud[c];
      this.drawCircle(circle,this.circlesOffset);
    }

    this.ctx.strokeStyle = params.contourColor;
    this.ctx.beginPath(); 
    this.ctx.arc(params.contourRadius,params.contourRadius,params.contourRadius,0, 2*Math.PI, false);
    this.ctx.stroke();

  },

  getRandom: function(min,max){
    return (Math.random()*(max-min))+min;
  }

}
$(function(){

  kernel.init();
  kernel.render();

});
