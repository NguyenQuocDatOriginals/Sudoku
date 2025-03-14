import React, { useEffect, useRef, useState, useCallback } from 'react';
import './App.scss';

// Cấu hình Sudoku
const GRID_SIZE = 9;
const CELL_SIZE = 60;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE; // 540px

export type Board = number[][];

const copyBoard = (board: Board): Board => board.map(row => row.slice());

// Hàm trộn mảng (dùng để trộn các số từ 1 đến 9)
const shuffleArray = (array: number[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

// Kiểm tra xem có thể đặt số num vào ô board[row][col] hay không
const isValidPlacement = (board: Board, row: number, col: number, num: number): boolean => {
  // Kiểm tra hàng
  for (let c = 0; c < GRID_SIZE; c++) {
    if (board[row][c] === num) return false;
  }
  // Kiểm tra cột
  for (let r = 0; r < GRID_SIZE; r++) {
    if (board[r][col] === num) return false;
  }
  // Kiểm tra khối 3x3
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
};

// Thuật toán backtracking để điền bảng với giải pháp hợp lệ
const fillBoard = (board: Board): boolean => {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] === 0) {
        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        shuffleArray(numbers);
        for (const num of numbers) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const generateSolvedBoard = (): Board => {
  const board: Board = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
  fillBoard(board);
  return board;
};

// Loại bỏ ngẫu nhiên một số ô từ bảng đã được giải thành một puzzle.
// Ở đây, cellsToRemove là số ô sẽ được gán giá trị 0 (ô trống).
const removeCells = (board: Board, cellsToRemove: number): Board => {
  const puzzle = copyBoard(board);
  let removed = 0;
  while (removed < cellsToRemove) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    if (puzzle[row][col] !== 0) {
      puzzle[row][col] = 0;
      removed++;
    }
  }
  return puzzle;
};

const generateRandomSudokuPuzzle = (): Board => {
  const solved = generateSolvedBoard();
  // Loại bỏ 40 ô để tạo puzzle (có thể điều chỉnh theo độ khó)
  return removeCells(solved, 40);
};

// Kiểm tra bảng đã giải xong hợp lệ chưa (tất cả ô đều khác 0 và không trùng số)
const isSolved = (board: Board): boolean => {
  // Kiểm tra hàng
  for (let r = 0; r < GRID_SIZE; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < GRID_SIZE; c++) {
      const val = board[r][c];
      if (val === 0 || seen.has(val)) return false;
      seen.add(val);
    }
  }
  // Kiểm tra cột
  for (let c = 0; c < GRID_SIZE; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < GRID_SIZE; r++) {
      const val = board[r][c];
      if (val === 0 || seen.has(val)) return false;
      seen.add(val);
    }
  }
  // Kiểm tra khối 3x3
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      const seen = new Set<number>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val = board[blockRow * 3 + r][blockCol * 3 + c];
          if (val === 0 || seen.has(val)) return false;
          seen.add(val);
        }
      }
    }
  }
  return true;
};

// Kiểm tra bảng đã được điền đầy (không còn ô trống)
const boardIsComplete = (board: Board): boolean => {
  for (const row of board) {
    if (row.includes(0)) return false;
  }
  return true;
};

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Mỗi lần chơi sẽ khởi tạo bảng mới
  const [board, setBoard] = useState<Board>(() => generateRandomSudokuPuzzle());
  // Mảng đánh dấu các ô cố định (clue) - không cho phép người chơi chỉnh sửa
  const [fixed, setFixed] = useState<boolean[][]>(() =>
    board.map(row => row.map(cell => cell !== 0))
  );
  // result: null (chưa hoàn thành), "win" hoặc "lose"
  const [result, setResult] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);

  // Hàm vẽ bảng Sudoku lên canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Vẽ các đường lưới (đường dày cho khối 3x3)
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.lineWidth = (i % 3 === 0) ? 3 : 1;
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Vẽ các con số
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = board[r][c];
        if (val !== 0) {
          ctx.fillStyle = fixed[r][c] ? 'black' : 'blue';
          ctx.fillText(val.toString(), c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
        }
      }
    }

    // Tô màu ô được chọn
    if (selected) {
      ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.fillRect(selected.col * CELL_SIZE, selected.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    // Nếu game kết thúc, hiển thị overlay thông báo (win hoặc lose)
    if (result) {
      ctx.fillStyle = result === "win" ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(
        result === "win" ? '' : '',
        CANVAS_SIZE / 2,
        CANVAS_SIZE / 2
      );
    }
  }, [board, fixed, selected, result]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Xử lý click trên canvas để chọn ô
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / CELL_SIZE);
      const row = Math.floor(y / CELL_SIZE);
      setSelected({ row, col });
    };
    canvas.addEventListener('click', handleClick);
    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  // Xử lý nhập bàn phím cho ô đã chọn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Nếu game đã kết thúc, không cho nhập thêm
      if (result) return;
      if (!selected) return;
      if (fixed[selected.row][selected.col]) return;
      let newVal = 0;
      if (e.key >= '1' && e.key <= '9') {
        newVal = parseInt(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        newVal = 0;
      } else {
        return;
      }
      setBoard(prevBoard => {
        const newBoard = prevBoard.map(row => row.slice());
        newBoard[selected.row][selected.col] = newVal;
        // Nếu bảng đã được điền đầy, kiểm tra xem có đúng hay không
        if (boardIsComplete(newBoard)) {
          if (isSolved(newBoard)) {
            setResult("win");
          } else {
            setResult("lose");
          }
        }
        return newBoard;
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selected, fixed, result]);

  // Reset game: tạo bảng mới ngẫu nhiên
  const handleReset = () => {
    const newPuzzle = generateRandomSudokuPuzzle();
    setBoard(newPuzzle);
    setFixed(newPuzzle.map(row => row.map(cell => cell !== 0)));
    setResult(null);
    setSelected(null);
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ border: '2px solid #000' }}
      />
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleReset}>Chơi lại</button>
      </div>
    </div>
  );
};

export default Game;