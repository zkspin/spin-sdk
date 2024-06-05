use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fmt;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsValue;

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub total_steps: u64,
    pub current_position: u64,
}

impl GameState {
    pub fn new() -> GameState {
        GameState {
            total_steps: 0,
            current_position: 0,
        }
    }
}

impl fmt::Display for GameState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "GameState {{ total_steps: {}, current_position: {} }}",
            self.total_steps, self.current_position
        )
    }
}

pub static GAME_STATE: Lazy<Mutex<GameState>> = Lazy::new(|| Mutex::new(GameState::new()));

pub const MAX_POSITION: u64 = 10;

#[wasm_bindgen]
pub fn init_game(total_steps: u64, current_position: u64) {
    let mut game = GAME_STATE.lock().unwrap();
    game.total_steps = total_steps;
    game.current_position = current_position;
}

/// Step function receives a encoded command and changes the global state accordingly
#[wasm_bindgen]
pub fn step(command: u64) {
    let mut game = GAME_STATE.lock().unwrap();
    match command {
        0 => {
            if game.current_position != 0 {
                game.current_position -= 1;

                game.total_steps += 1;
            }
        }
        1 => {
            if game.current_position != MAX_POSITION {
                game.current_position += 1;

                game.total_steps += 1;
            }
        }
        _ => {
            panic!("Invalid command");
        }
    };
}

#[wasm_bindgen]
pub fn get_game_state() -> String {
    let game = _get_game_state();
    serde_json::to_string(&game).unwrap()
}

pub fn _get_game_state() -> GameState {
    let game = GAME_STATE.lock().unwrap().clone();

    return game;
}
