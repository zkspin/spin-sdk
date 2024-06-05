use crate::definition::{RustGameState, RustInitializationParameters};

pub const MAX_POSITION: u64 = 10;

pub fn initialize_game(init_params: &RustInitializationParameters, game_state: &mut RustGameState) {
    game_state.total_steps = init_params.total_steps;
    game_state.current_position = init_params.current_position;
}

pub fn step(input: u64, game_state: &mut RustGameState) {
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
