use crate::definition::SpinGameStates;
use crate::spin::{ SpinGame, SpinGameTrait };
use once_cell::sync::Lazy;
use std::sync::Mutex;

pub const MAX_POSITION: u64 = 10;

/**
 * Mutex: For global state thread safe
 * Lazy: For global state initialization
 */
pub static GAME_STATE: Lazy<Mutex<SpinGameStates>> = Lazy::new(||
    Mutex::new(SpinGameStates::default())
);

impl SpinGameTrait for SpinGame {
    /* STATEFUL FUNCTIONS This defines the initialization of the game*/
    fn initialize_game(args: Vec<u64>) {
        let mut game_state = GAME_STATE.lock().unwrap();

        game_state.total_steps = args[0];
        game_state.current_position = args[1];
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
        }
    }

    /* VIEW FUNCTION This function returns the game state, to be used in Rust and Zkmain */
    fn get_game_state() -> Vec<u64> {
        let game = GAME_STATE.lock().unwrap().clone();
        return vec![game.total_steps, game.current_position];
    }
}
