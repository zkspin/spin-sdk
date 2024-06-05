use std::io::{stdin, stdout, Write};
use termion::event::Key;
use termion::input::TermRead;
use termion::raw::IntoRawMode;

use provable_game_logic::definition::RustGameState;
use provable_game_logic::gameplay::{_get_game_state, initialize_game, step};

fn print_number(stdout: &mut std::io::Stdout) {
    let final_game_state: RustGameState = _get_game_state();
    writeln!(stdout, "final_game_state: {}\r", final_game_state).unwrap();
}

const GAME_INSTRUCTIONS: &str =
    "Use <- (left arrow) and -> (right arrow) to control the game, q to quit.\r";

fn main() {
    let stdin = stdin();
    let mut stdout = stdout().into_raw_mode().unwrap();

    const total_steps: u64 = 0;
    const current_position: u64 = 0;

    initialize_game(total_steps, current_position);

    writeln!(stdout, "{}", GAME_INSTRUCTIONS).unwrap();
    print_number(&mut stdout);

    for c in stdin.keys() {
        match c.unwrap() {
            Key::Left => step(0),
            Key::Right => step(1),
            Key::Char('q') => break, // Quit the game
            _ => continue,
        }
        print_number(&mut stdout);
    }
}
