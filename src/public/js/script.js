const video2 = document.getElementById('video')

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video2: {} },
    stream => video2.srcObject = stream,
    err => console.error(err)
  )
}

video2.addEventListener('play', () => {      //비디오 켜지면 이벤트리스너 실행
  const canvas = faceapi.createCanvasFromMedia(video2)
  document.body.append(canvas)
  const displaySize = { width: video2.width, height: video2.height }
  faceapi.matchDimensions(canvas, displaySize)
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video2, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    //faceapi.draw.drawDetections(canvas, resizedDetections)      //얼굴윤곽선
    //faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)   //표정선 그리기
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections)   //

    let myObj = resizedDetections
    if(myObj["0"] === undefined){           //화면안에 안들어오면 undefined로 정의됨
      console.log("화면 안으로 들어오세요")
    }
    else{
      //console.log(myObj["0"].expressions["happy"]);  //중첩 키로 구현되어있기에 필요한 값을 가져오기 위함. 0키 안 expressions키 안 value 뽑아쓰면 될듯
      let data = myObj["0"].expressions["happy"]
      if(data > 0.4){
        console.log("밝은 얼굴이네요")
      }
      else{
        console.log("좀 웃어봐요")
      }
      /*
      switch(data) {
        case data > 0:
          console.log("밝은 얼굴이네요")  
          break

        default:
          //console.log("좀 웃어봐요")  
      }
      */
      //console.log(data)
    }
    
    /*
    var text = resizedDetections
    for(var key in text){
      console.log(text[key]+"나 여깃삼")

    }*/

    //console.log(resizedDetections)              //좌표값 찍혀있네
  }, 2000)  //딜레이 얼마나 걸지
})