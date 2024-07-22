use crate::definition::SpinGameInitArgs;
use crate::definition::SpinGameIntermediateStates;
use crate::spin::SpinGame;
use crate::spin::SpinGameTrait;
use once_cell::sync::Lazy;
use std::sync::Mutex;
use wasm_bindgen::prelude::*;

pub const MAX_POSITION: u64 = 10;

pub static GAME_STATE: Lazy<Mutex<SpinGameIntermediateStates>> =
    Lazy::new(|| Mutex::new(SpinGameIntermediateStates::new()));

impl SpinGameTrait for SpinGame {
    /* STATEFUL FUNCTIONS This defines the initialization of the game*/
    fn initialize_game(args: SpinGameInitArgs) {
        let mut game_state = GAME_STATE.lock().unwrap();

        game_state.total_steps = args.total_steps;
        game_state.current_position = args.current_position;
    }

    /* STATEFUL FUNCTIONS This is defines the logic when player moves one step/entering one command*/

    fn step(input: u64) {
        let mut game_state = GAME_STATE.lock().unwrap();

        match input {
            0 => {
                if game_state.current_position != 0 {
                    game_state.current_position -= 1;

                    game_state.total_steps += 1;
                }
            }
            1 => {
                if game_state.current_position != MAX_POSITION {
                    game_state.current_position += 1;

                    game_state.total_steps += 1;
                }
            }
            _ => {
                panic!("Invalid command");
            }
        };
    }

    /* PURE FUNCTION This function returns the game state, to be used in Rust and Zkmain */
    fn get_game_state() -> SpinGameIntermediateStates {
        let game = GAME_STATE.lock().unwrap().clone();
        return game;
    }
}
