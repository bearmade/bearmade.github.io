	  // set up the canvas element and get the 2D context
      var canvas = document.getElementById('canvas1');
      var ctx = canvas.getContext('2d');
      
      // set the canvas width and height to match the window size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // create a variable to hold the current mouse position
      var mousePos = { x: canvas.width/2, y: canvas.height/2 };
      
      // add an event listener to update the mouse position when it moves
      canvas.addEventListener('mousemove', function(event) {
        mousePos.x = event.clientX;
        mousePos.y = event.clientY;
      });
      
      // define the particle class
      function Particle(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.speed = {
          x: -1 + Math.random() * 2,
          y: -1 + Math.random() * 2
        };
        
        // define the draw method for the particle
        this.draw = function() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        }
        
        // define the update method for the particle
        this.update = function() {
          this.x += this.speed.x;
          this.y += this.speed.y;
          
          // wrap particles around the edges of the canvas
          if (this.x + this.size < 0) {
            this.x = canvas.width + this.size;
          }
          if (this.x - this.size > canvas.width) {
            this.x = -this.size;
          }
          if (this.y + this.size < 0) {
            this.y = canvas.height + this.size;
          }
          if (this.y - this.size > canvas.height) {
            this.y = -this.size;
          }
          
          // calculate the distance between the particle and the mouse
          var dx = mousePos.x - this.x;
          var dy = mousePos.y - this.y;
          var distance = Math.sqrt(dx*dx + dy*dy);
          
          // change the particle's speed based on the distance to the mouse
          if (distance < 200) {
            this.speed.x += dx * 0.0007;
            this.speed.y += dy * 0.0007;
          }
          
          // limit the particle's speed
          if (this.speed.x >      2) {
        this.speed.x = 2;
      }
      if (this.speed.y > 2) {
        this.speed.y = 2;
      }
      if (this.speed.x < -2) {
        this.speed.x = -2;
      }
      if (this.speed.y < -2) {
        this.speed.y = -2;
      }
    }
  }
  
  // create an array to hold the particles
  var particles = [];
  
  // create a function to initialize the particles
  function init() {
    for (var i = 0; i < 25; i++) {
      var size = Math.random() * 5 + 1;
      var x = Math.random() * (canvas.width - size * 2) + size;
      var y = Math.random() * (canvas.height - size * 2) + size;
      var color = 'rgba(200, 50, 50, 0.3)';
      particles.push(new Particle(x, y, size, color));
    }
  }
  
  // create a function to animate the particles
  function animate() {
    // clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // update and draw each particle
    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    
    // request the next animation frame
    requestAnimationFrame(animate);
  }
  
  // initialize the particles and start the animation loop
  init();
  animate();
