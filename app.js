let isConnected = false;
let turn = "X";  // O jogador "X" começa
let isMyTurn = true; // Variável para determinar se é a vez do jogador atual
const gameBoard = ["", "", "", "", "", "", "", "", ""]; // Tabuleiro do jogo

// Broker MQTT
const client = new Paho.MQTT.Client("wss://broker.hivemq.com:8000/mqtt", "clientId_" + Math.floor(Math.random() * 1000));

// Conectar ao broker MQTT
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

// Função para verificar se alguém ganhou
function checkWinner() {
    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
            document.getElementById("status").innerHTML = `${turn} venceu!`;
            return true;
        }
    }

    if (!gameBoard.includes("")) {
        document.getElementById("status").innerHTML = "Empate!";
        return true;
    }

    return false;
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

// Configuração para receber mensagens
client.onMessageArrived = onMessageArrived;

// Evento de clique nas células do tabuleiro
document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => playTurn(cell));
});

// Atualiza o status inicial
updateStatus();
