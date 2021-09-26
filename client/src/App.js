import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

function App() {
  console.log("rerender");
  const socketRef = useRef();
  //role select
  const [role, setRole] = useState("");

  //form input
  const [nameInput, setNameInput] = useState("");
  const [playerCodeInput, setPlayerCodeInput] = useState("");
  const [gameCodeInput, setGameCodeInput] = useState("");

  //game variables
  const [game, setGame] = useState("");
  const [inGame, setInGame] = useState("");
  const [question, setQuestion] = useState();
  const [scorers, setScorers] = useState([]);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:80/");

    socketRef.current.on("connect", () => {
      console.log(socketRef.current.id);
    });

    //receives if game started
    socketRef.current.on("game", (game) => {
      console.log("game data received");
      console.log(game);
      setGame(game);
    });

    //receives check (if player joined or game started)
    socketRef.current.on("check", (code) => {
      console.log("game data received");
      setInGame(code);
    });

    //receives question
    socketRef.current.on("question", (question) => {
      console.log("question received: ", question);
      setQuestion(question);
    });
  }, []);

  useEffect(() => {
    //receives player who scored point
    socketRef.current.on("winner", (winner) => {
      console.log(scorers);
      console.log("received winner");
      let temp = [...scorers];
      temp.push(winner);
      console.log("setting scorers to");
      console.log(temp);
      setScorers([...temp]);
    });
  }, [scorers]);

  const onSubmitPlayer = (event) => {
    event.preventDefault();
    if (
      nameInput ||
      nameInput.trim ||
      nameInput.trim().length !== 0 ||
      playerCodeInput ||
      playerCodeInput.trim ||
      playerCodeInput.trim().length !== 0
    ) {
      let player = {
        id: socketRef.current.id,
        name: nameInput,
        game: playerCodeInput,
        points: 0,
      };
      socketRef.current.emit("player", player);
      setNameInput("");
      setPlayerCodeInput("");
      console.log("player sent:", player);
    }
  };

  const onSubmitHost = (event) => {
    event.preventDefault();
    console.log("set up game with code: ", gameCodeInput);
    if (gameCodeInput !== "") {
      socketRef.current.emit("code", gameCodeInput);
    }
  };

  const startGame = () => {
    socketRef.current.emit("onStart", game.host);
  };

  const submitAnswer = (vote, user, game) => {
    console.log("submitting answer");
    console.log(vote);
    console.log(user);
    socketRef.current.emit("answer", [game, { id: user, vote: vote }]);
    setVoted(true);
  };

  return (
    <div className="App">
      <h1>Who would 🤔</h1>
      <button onClick={() => setRole("host")}>Create room</button>
      <button onClick={() => setRole("player")}>Join room</button>

      {role === "player" ? (
        <>
          <h2>Player View</h2>
          {!inGame ? (
            <form onSubmit={onSubmitPlayer}>
              <label htmlFor="name">Username</label>
              <br />
              <input
                type="text"
                value={nameInput}
                onChange={(event) => {
                  setNameInput(event.target.value);
                }}
              />
              <br />
              <label htmlFor="name">Code</label>
              <br />
              <input
                type="text"
                value={playerCodeInput}
                onChange={(event) => {
                  setPlayerCodeInput(event.target.value);
                }}
              />
              <br />
              <button type="submit">Join</button>
            </form>
          ) : null}
          {game.active ? (
            !voted ? (
              game.players.map((player) => (
                <p
                  key={player.id}
                  onClick={() =>
                    submitAnswer(player.id, socketRef.current.id, game)
                  }
                >
                  {player.name}
                </p>
              ))
            ) : (
              <p>{console.log(voted)}Waiting for other players to vote...</p>
            )
          ) : inGame ? (
            <p>Waiting for host to start...</p>
          ) : null}
        </>
      ) : null}
      {role === "host" ? (
        <>
          <h2>Host View</h2>
          {!inGame ? (
            <>
              <form onSubmit={onSubmitHost}>
                <label htmlFor="name">Code</label>
                <br />
                <input
                  type="text"
                  value={gameCodeInput}
                  onChange={(event) => {
                    setGameCodeInput(event.target.value);
                  }}
                />
                <br />
                <button type="submit">Host</button>
              </form>
            </>
          ) : !game.active ? (
            <>
              <h3>Code: {inGame}</h3>
              {game
                ? game.players.map((player) => (
                    <p key={player.id}>{player.name}</p>
                  ))
                : null}
              {game.playable ? (
                <button onClick={() => startGame()}>Host</button>
              ) : (
                <p>waiting for players...</p>
              )}
            </>
          ) : scorers.length === 0 ? (
            <p>{question}</p>
          ) : (
            game.players.map((player) => (
              <>
                <p key={player.id}>player: {player.name}</p>
                <p>
                  now has {player.points} points
                  {scorers.map((scorer) => {
                    if (scorer === player.id) {
                      console.log("match found");
                      return <strong> (+1)</strong>;
                    } else {
                      return null;
                    }
                  })}
                </p>
                <p>_________________</p>
              </>
            ))
          )}
        </>
      ) : null}
    </div>
  );
}

export default App;
