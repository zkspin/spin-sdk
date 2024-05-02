use std::io::{stdin, stdout, Write};
use termion::event::Key;
use termion::input::TermRead;
use termion::raw::IntoRawMode;

use zk::game::{_get_game_state, init_game, step, GameState};

fn print_number(stdout: &mut std::io::Stdout) {
    let final_game_state: GameState = _get_game_state();
    writeln!(stdout, "final_game_state: {}\r", final_game_state).unwrap();
}

fn main() {
    let stdin = stdin();
    let mut stdout = stdout().into_raw_mode().unwrap();

    init_game(0, 0);

    writeln!(
        stdout,
        "Use <- (left arrow) and -> (right arrow) to control the game, q to quit.\r"
    )
    .unwrap();
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
