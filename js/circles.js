kernel = {

  init: function(){
    this.canvas = $("#render");
    this.ctx = this.canvas[0].getContext("2d");
    this.debugCanvas = $("#debug");
    this.dctx = this.debugCanvas[0].getContext("2d");
  },

  reset: function(){
    this.params  = {
      minRadius: parseInt($("#minRadius").val(), 10),
      maxRadius: parseInt($("#maxRadius").val(),10),
      maxSepDistance: parseInt($("#maxSepDistance").val(), 10),
      circleCount: parseInt($("#circleCount").val(), 10),
      contourRadius: parseInt($("#contourRadius").val(),10),
      contourColor: $("#contourColor").val(),
      circlesColor: $("#circlesColor").val()
    };
    
    this.circles = {};
    
    this.circlesOffset = {x: this.params.contourRadius, y: this.params.contourRadius };

    this.params.angleStep = this.toFixedDeg(Math.acos((2*Math.pow(this.params.contourRadius,2)-Math.pow(2*this.params.minRadius+this.params.maxSepDistance,2))/(2*Math.pow(this.params.contourRadius,2))));
    this.params._maxDistance = this.params.contourRadius - this.params.maxSepDistance - this.params.minRadius;
  },

  debugCompare: function(faCircle, circle){
    return;
    this.ctx.strokeStyle = "black";
    this.drawCircle(faCircle,this.circlesOffset);              
    this.ctx.strokeStyle = "blue";
    this.drawCircle(circle,this.circlesOffset);              
  },

  addCircle: function(angle,circle){
    angle = this.toFixedDeg(angle); 
    this.circles[angle] = this.circles[angle] || [];
    this.circles[angle].push(circle);
  },

  toFixedDeg: function(angle){
    return Math.round(angle*180/Math.PI);
  },

  toRad: function(angle){
    return angle*Math.PI/180;
  },

  getCone: function(angle,radius,offset){
    var radiusRange = radius + this.params.maxRadius + 2 * this.params.maxSepDistance;
    var deltaAngle = Math.atan(radiusRange/(offset+radius+this.params.maxSepDistance));
    var out = [];
    
    var startAngle = angle - deltaAngle;
    if(startAngle < 0){
      startAngle += 2*Math.PI;
    }
    var angleStep = this.toRad(this.params.angleStep);
    startAngle = Math.floor(startAngle/angleStep)*angleStep;

    var endAngle = Math.ceil((angle+deltaAngle)%(2*Math.PI)/angleStep)*angleStep;

    this.drawCone(startAngle,endAngle);

    startAngle = this.toFixedDeg(startAngle);
    endAngle = this.toFixedDeg(endAngle);

    for(var a = startAngle; a !== endAngle; a += this.params.angleStep){
      if(a >= 360){ 
        a = 0;
      }
      if(this.circles[a] && this.circles[a].length > 0){
        out = out.concat(this.circles[a]);
      }
    }
    return out;
  },

  drawCone: function(startAngle,endAngle){
    return;
    this.ctx.clearRect(0,0,this.params.contourRadius*2,this.params.contourRadius*2);
    this.ctx.beginPath();
    this.ctx.moveTo(this.params.contourRadius,this.params.contourRadius);
    this.ctx.lineTo(Math.cos(startAngle)*this.params.contourRadius, Math.sin(startAngle)*this.params.contourRadius);
    this.ctx.closePath();
    this.ctx.beginPath();
    this.ctx.moveTo(this.params.contourRadius,this.params.contourRadius);
    this.ctx.lineTo(Math.cos(endAngle)*this.params.contourRadius, Math.sin(endAngle)*this.params.contourRadius);
    this.ctx.closePath();
  },

  generateCircleCloud: function(){
    this.circles[361] = [{
        x: 0,
        y: 0,
        radius: this.params.maxRadius
    }];
    for(var a = 0 ; a <= Math.PI*2; a+= this.toRad(this.params.angleStep)){
      var offset = this.params.maxRadius + this.params.maxSepDistance;
      createCircle:
        while(offset < this.params._maxDistance){
          //  console.log("NEW OFFSET ==+==");
          var circle = {};

          var maxRadius = this.getRandom(this.params.minRadius, this.params.maxRadius);
          circle.x = (offset+maxRadius)*Math.cos(a); 
          circle.y = (offset+maxRadius)*Math.sin(a);
          circle.radius = maxRadius;

          searchList:
            
            var searchList = this.getCone(a, circle.radius, offset);

            for(var c = 0; c < searchList.length; c++){
              var faCircle = searchList[c];
              var distance = Math.sqrt(Math.pow(Math.abs(faCircle.x-circle.x),2)+Math.pow(Math.abs(faCircle.y-circle.y),2)) - faCircle.radius - this.params.maxSepDistance;
              
              this.debugCompare(faCircle, circle, this.params); 
              if(distance < this.params.minRadius){
                offset = Math.sqrt(Math.pow(faCircle.x,2) + Math.pow(faCircle.y,2)) + faCircle.radius + 2*this.params.maxSepDistance;
                //console.log("NO HOPE", faCircle,circle);
                continue createCircle;
              } else if( distance > this.params.minRadius && distance < maxRadius){
                maxRadius = distance;
                circle.radius = maxRadius;
                this.debugCompare(faCircle, circle,this.params); 
                //console.log("Reducing Max RD", maxRadius,circle);
              } else {
                this.debugCompare(faCircle, circle,this.params); 
                //console.log("OK", distance);
              }
            }


            if(offset+circle.radius*2 > this.params._maxDistance && offset+this.params.minRadius*2 < this.params._maxDistance){
              circle.radius = (this.params._maxDistance - offset) / 2
            } else if( offset+this.params.minRadius*2 > this.params._maxDistance){
              break;
            }

            //circle.x = offset*Math.cos(a); 
            //circle.y = offset*Math.sin(a);
            this.ctx.strokeStyle = "green";
            this.drawCircle(circle,this.circlesOffset,true);
            this.addCircle(a, circle);
            offset += circle.radius*2 + this.params.maxSepDistance;
        }
    }
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
    this.reset();
    console.time("Generating Circles");
    this.generateCircleCloud();
    console.timeEnd("Generating Circles");
    this.canvas.attr({
      height: this.params.contourRadius*2,
      width: this.params.contourRadius*2
    });

    this.ctx.clearRect(0,0,this.params.contourRadius*2,this.params.contourRadius*2);
    this.ctx.strokeStyle = this.params.circlesColor;

    for(var a in this.circles){
      for(var c in this.circles[a]){ 
        circle = this.circles[a][c];
        this.drawCircle(circle,this.circlesOffset);
      }
    }

    this.ctx.strokeStyle = this.params.contourColor;
    this.ctx.beginPath(); 
    this.ctx.arc(this.params.contourRadius,this.params.contourRadius,this.params.contourRadius,0, 2*Math.PI, false);
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
