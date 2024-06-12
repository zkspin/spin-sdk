use std::io::{stdin, stdout, Write};
use termion::event::Key;
use termion::input::TermRead;
use termion::raw::IntoRawMode;

use provable_game_logic::definition::RustGameState;
use provable_game_logic::gameplay::{_get_game_state, initialize_game, step};

fn print_game_state(stdout: &mut std::io::Stdout) {
    let final_game_state: RustGameState = _get_game_state();
    writeln!(stdout, "{}\r", final_game_state).unwrap();
}

const GAME_INSTRUCTIONS: &str =
    "Use <- (left arrow) and -> (right arrow) to control the game, q to quit.\r";

fn main() {
    let stdin = stdin();
    let mut stdout = stdout().into_raw_mode().unwrap();

    const INITIAL_TOTAL_STEPS: u64 = 0;
    const INIITAL_CURRENT_POSITION: u64 = 0;

    initialize_game(INITIAL_TOTAL_STEPS, INIITAL_CURRENT_POSITION);

    writeln!(stdout, "{}", GAME_INSTRUCTIONS).unwrap();
    print_game_state(&mut stdout);

    for c in stdin.keys() {
        match c.unwrap() {
            Key::Left => step(0),
            Key::Right => step(1),
            Key::Char('q') => break, // Quit the game
            _ => continue,
        }
        print_game_state(&mut stdout);
    }
}
