// 初始化 socket 连接
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
// 缓存所有连接到同一房间的其他用户
const peers = {}
// 连接 peerjs 服务器
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})

// 视频元素：来自当前用户设备的视频流
const myVideo = document.createElement('video')
myVideo.style.border = '3px solid red'
myVideo.muted = true

// 当 peer 连接打开时，通过socket向服务器发送一个'join-room'事件
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

// 获取当前用户视频流
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(currentStream => {
  // 添加当前用户的视频流数据及 video 元素
  addVideoStream(myVideo, currentStream)
  
  // 监听其他用户的连接事件
  socket.on('user-connected', (userId) => {
    // 发起 peer 连接
    connectToNewUser(userId, currentStream)
  })

  // 监听'call'事件，
  myPeer.on('call', call => {
    // 当收到其他用户的音视频流时，将当前用户的视频流返回给其他用户
    call.answer(currentStream)
    const video = document.createElement('video')
    call.on('stream', otherVideoStream => {
      addVideoStream(video, otherVideoStream)
    })
  })
})

// socket 断开连接事件
socket.on('user-disconnected', userId => {
  if(peers[userId])
    peers[userId].close()
})


// 添加（其他用户）视频元素
function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

// 连接到（其他）用户
function connectToNewUser(userId, stream) {
  // 向该用户建立连接
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  }) 
  // close 事件触发后，移除 video 元素
  call.on('close', () => {
    video.remove()
  })
  // 缓存新用户连接
  peers[userId] = call
}