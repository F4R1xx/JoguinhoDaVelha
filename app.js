let isConnected = false;
const client = new Paho.MQTT.Client("wss://test.mosquitto.org:8080", "clientId_" + Math.floor(Math.random() * 1000));

client.connect({
    onSuccess: () => {
        console.log("Conectado ao broker MQTT");
        isConnected = true;  // Marca como conectado
        client.subscribe("jogo-da-velha");
    },
    onFailure: (e) => {
        console.log("Falha na conexão, tentando novamente em 2 segundos...", e);
        setTimeout(() => {
            client.connect();  // Tenta reconectar após 2 segundos
        }, 2000);
    }
});

// Função para atualizar o status
function updateStatus() {
    const status = document.getElementById("status");
    status.innerHTML = `Vez do jogador: ${turn}`;
}

// Função para jogar
function playTurn(cell) {
    const cellIndex = cell.dataset.cell;

    if (gameBoard[cellIndex] || !isMyTurn) return;

    gameBoard[cellIndex] = turn;
    cell.innerHTML = turn;
    if (checkWinner()) return;

    // Trocar turno
    turn = turn === "X" ? "O" : "X";
    isMyTurn = false;

    if (isConnected) {
        const message = new Paho.MQTT.Message(JSON.stringify({ index: cellIndex, turn }));
        message.destinationName = "jogo-da-velha";
        client.send(message);
        updateStatus();
    } else {
        console.log("Aguardando conexão para enviar a jogada.");
    }
}

// Função para processar jogadas recebidas
function onMessageArrived(message) {
    const data = JSON.parse(message.payloadString);
    const cell = document.querySelector(`[data-cell="${data.index}"]`);
    gameBoard[data.index] = data.turn;
    cell.innerHTML = data.turn;
    turn = data.turn === "X" ? "O" : "X";
    isMyTurn = true;
    updateStatus();
}

client.onMessageArrived = onMessageArrived;

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => playTurn(cell));
});

updateStatus();
