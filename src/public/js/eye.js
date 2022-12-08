







const DrawIrisResult = (left, right) => {
    const left_eye_list = left;
    const right_eye_list = right;
    console.log(left_eye_list);
    console.log(right_eye_list);
    var c = document.getElementById("myCanvas");
    var c2 = document.getElementById("myCanvas2");
    var leftctx = c.getContext("2d");
    var rightctx = c2.getContext("2d");

    // 가로 세로 선 그리기
    leftctx.strokeStyle = "#000000";
    leftctx.lineWidth = 1;
    // 세로 축
    leftctx.beginPath();
    leftctx.moveTo(0, 250);
    leftctx.lineTo(500, 250);
    leftctx.stroke();
    // 가로 축
    leftctx.beginPath();
    leftctx.moveTo(250, 0);
    leftctx.lineTo(250, 500);
    leftctx.stroke();

    // 가로 세로 선 그리기
    rightctx.strokeStyle = "#000000";
    rightctx.lineWidth = 1;
    // 세로 축
    rightctx.beginPath();
    rightctx.moveTo(0, 250);
    rightctx.lineTo(500, 250);
    rightctx.stroke();
    // 가로 축
    rightctx.beginPath();
    rightctx.moveTo(250, 0);
    rightctx.lineTo(250, 500);
    rightctx.stroke();

    leftctx.fillStyle = "#000000";
    leftctx.strokeStyle = "000000";
    rightctx.fillStyle = "000000";
    rightctx.strokeStyle = "000000";
    
    for (let i = 1; i < left_eye_list.length; i++) {
      // console.log(left_eye_list[i].x);
      leftctx.beginPath();
      leftctx.arc(
        left_eye_list[i].x - left_eye_list[0].x + 250,
        left_eye_list[i].y - left_eye_list[0].y + 250,
        5,
        0,
        2 * Math.PI
      );

      leftctx.stroke();
      leftctx.fill();

      rightctx.beginPath();
      rightctx.arc(
        right_eye_list[i].x - right_eye_list[0].x + 250,
        right_eye_list[i].y - right_eye_list[0].y + 250,
        5,
        0,
        2 * Math.PI
      );
      rightctx.stroke();
      rightctx.fill();
    }
  };

  fetch("http://localhost:3000/getEyearray")
  .then((response) => response.json())
  .then((data) => {
        console.log(data);
        const left_eye_list = data.left;
        const right_eye_list = data.right;
        DrawIrisResult(left_eye_list,right_eye_list);
    });


    
