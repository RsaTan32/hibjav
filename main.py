import eel
import numpy as np
from logic import parity
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

eel.init('web')

@eel.expose
def process_interactive_pivot(matrix_data, r, c, target, modulus=13):
    """
    Process one interactive pivot step for parity matrix calculation.
    
    Args:
        matrix_data: Current matrix
        r: Selected row
        c: Selected column
        target: Target row (for labeling)
        modulus: Modulus for calculations (default: 13)
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"[JS -> PYTHON] Interactive pivot (mod {modulus})")
    logger.info(f"  Target row: {target}")
    logger.info(f"  Selected pivot: [{r}, {c}]")
    logger.info(f"  Input matrix shape: {np.array(matrix_data).shape}")
    
    result = parity.calculate_interactive_step(matrix_data, r, c, target, modulus)
    
    logger.info(f"[PYTHON -> JS] Sending response:")
    logger.info(f"  Success: {result.get('success', False)}")
    if result.get('success'):
        logger.info(f"  Output matrix shape: {np.array(result['matrix']).shape}")
    else:
        logger.info(f"  Error: {result.get('error', 'Unknown')}")
    logger.info(f"{'='*60}\n")
    
    return result

@eel.expose
def extract_parity_matrix_extended(sorted_G, k, n, modulus, pivoted_columns):
    """
    Extract parity matrix from sorted systematic form.
    
    Args:
        sorted_G: Sorted generator matrix (n×n)
        k: Number of information bits
        n: Total codeword length
        modulus: Z_p modulus
        pivoted_columns: List of column indices where pivots were performed
        
    Returns:
        Dictionary with H matrix and verification data
    """
    logger.info(f"[JS -> PYTHON] Extract parity matrix (mod {modulus})")
    logger.info(f"Pivoted columns: {pivoted_columns}")
    
    result = parity.extract_parity_matrix_extended(sorted_G, k, n, modulus, pivoted_columns)
    
    logger.info(f"[PYTHON -> JS] Extraction result:")
    logger.info(f"  Success: {result.get('success', False)}")
    if result.get('success'):
        logger.info(f"  H shape: {np.array(result['H']).shape}")
    
    return result

@eel.expose
def solve_matrix(data):
    """
    Original Gauss-Jordan solver (for pivot tab).
    """
    matrix = np.array(data, dtype=float)
    rows, cols = matrix.shape
    steps = []

    steps.append({
        "matrix": matrix.copy().tolist(),
        "description": "Kezdő mátrix"
    })

    pivot_row = 0
    for j in range(cols):
        if pivot_row >= rows: break

        max_row = pivot_row + np.argmax(np.abs(matrix[pivot_row:, j]))

        if np.abs(matrix[max_row, j]) < 1e-10:
            continue

        if max_row != pivot_row:
            matrix[[pivot_row, max_row]] = matrix[[max_row, pivot_row]]
            steps.append({
                "matrix": matrix.copy().tolist(),
                "description": f"Sorcsere: R{pivot_row+1} ↔ R{max_row+1}"
            })

        pivot_val = matrix[pivot_row, j]
        matrix[pivot_row] = matrix[pivot_row] / pivot_val
        steps.append({
            "matrix": matrix.copy().tolist(),
            "description": f"R{pivot_row+1} normalizálás: osztás {pivot_val:.2f}-vel"
        })

        for i in range(rows):
            if i != pivot_row:
                factor = matrix[i, j]
                matrix[i] = matrix[i] - factor * matrix[pivot_row]
                steps.append({
                    "matrix": matrix.copy().tolist(),
                    "description": f"R{i+1} = R{i+1} - ({factor:.2f} × R{pivot_row+1})"
                })

        pivot_row += 1

    return steps

@eel.expose
def verify_parity_check(G, H, modulus):
    """
    Verify G × H^T ≡ 0 (mod p).

    Args:
        G: Generator matrix (k×n)
        H: Parity check matrix ((n-k)×n)
        modulus: Z_p modulus
        
    Returns:
        Dictionary with verification result and detailed computation steps
    """
    try:
        G_np = np.array(G, dtype=np.int32) % modulus
        H_np = np.array(H, dtype=np.int32) % modulus
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Verifying G × H^T ≡ 0 (mod {modulus})")
        logger.info(f"G shape: {G_np.shape}")
        logger.info(f"H shape: {H_np.shape}")
        logger.info(f"G:\n{G_np}")
        logger.info(f"H:\n{H_np}")
        
        # H^T
        H_T = H_np.T
        logger.info(f"\nH^T shape: {H_T.shape}")
        logger.info(f"H^T:\n{H_T}")
        
        # G × H^T
        product = np.dot(G_np, H_T) % modulus
        
        logger.info(f"\nG × H^T (mod {modulus}):")
        logger.info(f"Shape: {product.shape}")
        logger.info(f"Result:\n{product}")
        
        # Check if all zeros
        is_zero = np.all(product == 0)
        
        logger.info(f"\nIs zero matrix: {is_zero}")
        logger.info(f"{'='*60}\n")
        
        return {
            "success": True,
            "is_valid": bool(is_zero),
            "G": G_np.tolist(),
            "H": H_np.tolist(),
            "H_T": H_T.tolist(),
            "product": product.tolist(),
            "modulus": modulus
        }
        
    except Exception as e:
        logger.error(f"Error during verification: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }

def get_Center_position(window_width, window_height):
    """
    calculate center position for window.
    Returns (x, y) coordinates.
    """
    try:
        import tkinter as tk

        # create temp hidden window to get screensize
        root = tk.Tk()
        root.withdraw()

        # get screen dimensions
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()

        # calculate center position
        x = (screen_width - window_width) // 2
        y = (screen_height - window_height) // 2

        x = max(0, x)
        y = max(0, y)

        root.destroy()

        logger.info(f"Screen size: {screen_width}x{screen_height}")
        logger.info(f"Window size: {window_width}x{window_height}")
        logger.info(f"center position: ({x}, {y})")

        return (x, y)
    except Exception as e:
        logger.warning(f"Could not calculate center position: {e}")
        logger.info("Using default position (100,100)")
        return (100, 100)
    
if __name__ == '__main__':
    logger.info("Starting HibJav application...")

    window_width = 1200
    window_height = 900
    position = get_Center_position(window_width, window_height)

    try:
        eel.start('index.html', size=(window_width, window_height), position=position, port=0)
    except Exception as e:
        logger.error(f"Failed to start application: {e}", exc_info=True)