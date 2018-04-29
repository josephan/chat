import {Socket, Presence} from 'phoenix';

class Chat {
  constructor(roomName) {
    this.presences = {};
    this.roomName = roomName;
    this.userList = document.getElementById('user-list');
    this.messageInput = document.getElementById('new-message');
    this.messageList = document.getElementById('message-list');
    this.renderPresences = this.renderPresences.bind(this);
    this.formatPresences = this.formatPresences.bind(this);
    this.renderMessage = this.renderMessage.bind(this);
  }

  initialize() {
    // ask for the user's name
    this.user = window.prompt('What is your name?') || 'Anonymous';

    // set up the websocket connection
    this.socket = new Socket('/socket', {params: {user: this.user}});
    this.socket.connect();

    // set up a room
    this.room = this.socket.channel(this.roomName);

    // sync presence state
    this.room.on('presence_state', state => {
      console.log('PRESENCE_STATE: ', state);
      this.presences = Presence.syncState(this.presences, state);
      this.renderPresences(this.presences);
    });

    this.room.on('presence_diff', state => {
      console.log('PRESENCE_DIFF: ', state);
      this.presences = Presence.syncDiff(this.presences, state);
      this.renderPresences(this.presences);
    });

    // setup new message handler
    this.room.on('message:new', this.renderMessage);

    // setup input handlers
    this.messageInput.addEventListener('keypress', e => {
      if (e.keyCode === 13 && this.messageInput.value != '') {
        this.room.push('message:new', this.messageInput.value);
        this.messageInput.value = '';
      }
    });

    // join the room
    this.room.join();
  }

  formatTimestamp(timestamp) {
    let date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  formatPresences(presences) {
    return Presence.list(presences, (user, {metas}) => {
      return {
        user: user,
        onlineAt: this.formatTimestamp(metas[0].online_at),
      };
    });
  }

  renderPresences(presences) {
    let html = this.formatPresences(presences)
      .map(
        presence => `
    <li>
      ${presence.user}
      <br />
      <small>online since ${presence.onlineAt}</small>
    </li>
    `,
      )
      .join('');

    this.userList.innerHTML = html;
  }

  renderMessage(message) {
    let messageElement = document.createElement('li');
    messageElement.innerHTML = `
      <b>${message.user}</b>  
      <i>${this.formatTimestamp(message.timestamp)}</i>
      <p>${message.body}</p>
    `;

    this.messageList.appendChild(messageElement);
    this.messageList.scrollTop = this.messageList.scrollHeight;
  }
}

export default Chat;
