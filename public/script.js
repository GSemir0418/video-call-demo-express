// 初始化 socket 连接（相对路径）
const socket = io('/')
const videoGrid = document.getElementById('video-grid')
// 缓存所有连接到同一房间的其他用户
const peers = {}
// 与 peerjs 服务器连接
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3001'
})

// 视频元素：来自用户自己的设备的视频流
const myVideo = document.createElement('video')
myVideo.style.border = '3px solid red'
myVideo.muted = true

// 获取用户视频流
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  addVideoStream(myVideo, stream)
  // 当其他用户加入房间时，
  // 连接到此用户并发送自己的视频流给他
  socket.on('user-connected', (userId) => {
    connectToNewUser(userId, stream)
  })

  // 监听'call'事件，当收到其他用户的音视频流时，我们会为其创建一个新的video元素并播放
  myPeer.on('call', call => {
    // 将其他用户的视频流返回给当前用户
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })
})

// socket 断开连接事件
socket.on('user-disconnected', userId => {
  if(peers[userId])
    peers[userId].close()
})

// 当 peer 连接打开时，我们通过socket向服务器发送一个'join-room'事件，告诉服务器我们加入了哪个房间
myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
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
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  }) 
  call.on('close', () => {
    video.remove()
  })
  peers[userId] = call
}