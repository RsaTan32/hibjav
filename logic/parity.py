import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def modInverse(a, m):
    """
    Calculate modular multiplicative inverse in Z_m.
    """
    a = a % m
    if a == 0:
        raise ValueError(f"Cannot find inverse of 0 in Z_{m}")
    
    for x in range(1, m):
        if (a * x) % m == 1:
            logger.info(f"Modular inverse of {a} mod {m} is {x}")
            return x
    
    raise ValueError(f"No modular inverse exists for {a} mod {m}")


def calculate_interactive_step(matrix_data, sel_row, sel_col, target_row, modulus=13):
    """
    Perform one interactive pivot step with custom modulus.
    """
    try:
        logger.info(f"\n{'='*50}")
        logger.info(f"Starting pivot operation (mod {modulus}):")
        logger.info(f"  Selected cell: [{sel_row}, {sel_col}]")
        logger.info(f"  Target row (for labeling): {target_row}")
        logger.info(f"  Input matrix:\n{np.array(matrix_data)}")
        
        matrix = np.array(matrix_data, dtype=np.int32) % modulus
        logger.info(f"  Matrix after modulo {modulus}:\n{matrix}")

        rows, cols = matrix.shape
        log = []

        # Validate indices
        if not (0 <= sel_row < rows and 0 <= sel_col < cols):
            raise ValueError(f"Invalid cell selection: [{sel_row}, {sel_col}]")
        
        if not (0 <= target_row < rows):
            raise ValueError(f"Invalid target row: {target_row}")
        
        #  Check if pivot element is zero
        pivot_val = int(matrix[sel_row, sel_col])
        logger.info(f"  Pivot value at [{sel_row}, {sel_col}]: {pivot_val}")
        
        if pivot_val == 0:
            raise ValueError(f"Cannot pivot on zero element at [{sel_row}, {sel_col}]")
        
        # Normalize
        inv = modInverse(pivot_val, modulus)
        logger.info(f"  Modular inverse of {pivot_val} mod {modulus}: {inv}")

        old_row = matrix[sel_row].copy()
        matrix[sel_row] = (matrix[sel_row] * inv) % modulus
        log.append(f"R{sel_row+1} normalizálás: szorzás {inv}-vel (mod {modulus}), hogy pivot = 1")
        logger.info(f"Normalization: R{sel_row+1} * {inv} mod {modulus}")
        logger.info(f"  Before: {old_row}")
        logger.info(f"  After:  {matrix[sel_row]}")
        
        # Eliminate
        for i in range(rows):
            if i != sel_row:
                factor = int(matrix[i, sel_col])
                if factor != 0:
                    old_row = matrix[i].copy()
                    matrix[i] = (matrix[i] - factor * matrix[sel_row]) % modulus
                    log.append(f"R{i+1} = R{i+1} - ({factor} × R{sel_row+1}) mod {modulus}")
                    logger.info(f"Elimination: R{i+1}: subtract ({factor} × R{sel_row+1}) mod {modulus}")
                    logger.info(f"  Before: {old_row}")
                    logger.info(f"  After:  {matrix[i]}")
        
        logger.info(f"Final matrix:\n{matrix}")
        logger.info(f"Pivot operation completed successfully")
        logger.info(f"{'='*50}\n")
        
        return {
            "success": True,
            "matrix": matrix.tolist(),
            "description": "<br>".join(log),
            "pivot_row": sel_row,
            "pivot_col": sel_col,
            "target_row": target_row
        }
        
    except ValueError as e:
        logger.error(f"ValueError in pivot operation: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "matrix": matrix_data
        }
    except Exception as e:
        logger.error(f"Unexpected error in pivot operation: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": f"Váratlan hiba történt: {str(e)}",
            "matrix": matrix_data
        }


def extract_parity_matrix_extended(sorted_G, k, n, modulus, pivoted_columns):
    """
    Extract parity matrix H directly from the pivoted matrix.
    H consists of the columns where NO pivot was performed (transposed).
    
    Args:
        sorted_G: Sorted generator matrix after pivoting and adding extra rows (n×n)
        k: Number of information bits (original rows)
        n: Total codeword length
        modulus: Z_p modulus
        pivoted_columns: List of column indices where pivots were performed
        
    Returns:
        Dictionary with H matrix
    """
    try:
        G_full = np.array(sorted_G, dtype=np.int32) % modulus
        logger.info(f"\n{'='*60}")
        logger.info(f"Extracting parity matrix from sorted G ({n}×{n}) mod {modulus}")
        logger.info(f"Full sorted G:\n{G_full}")
        logger.info(f"Pivoted columns: {pivoted_columns}")
        
        # Azonosítsuk a nem-pivotált oszlopokat
        all_columns = list(range(n))
        non_pivoted_columns = [col for col in all_columns if col not in pivoted_columns]
        
        logger.info(f"Non-pivoted columns (these form H): {non_pivoted_columns}")
        
        if len(non_pivoted_columns) == 0:
            raise ValueError("No non-pivoted columns found! Check your pivot operations.")
        
        # H mátrix = a nem-pivotált oszlopok transzponáltja
        # Kiválasztjuk az oszlopokat, majd transzponáljuk
        H_columns = G_full[:, non_pivoted_columns]  # (n × len(non_pivoted_columns))
        H = H_columns.T  # Transzponáljuk: (len(non_pivoted_columns) × n)
        
        logger.info(f"\nSelected columns from G (before transpose):")
        logger.info(f"Shape: {H_columns.shape}")
        logger.info(f"Columns:\n{H_columns}")
        
        logger.info(f"\nParity matrix H (transposed columns):")
        logger.info(f"Shape: {H.shape}")
        logger.info(f"H:\n{H}")
        
        # Az eredeti G mátrix: az utolsó k sor a rendezett mátrixból
        # (Az első (n-k) sor tartalmazza a (Z-1) értékeket)
        G_original_start = n - k
        G_original = G_full[G_original_start:, :]
        
        logger.info(f"\nOriginal G matrix (last {k} rows):")
        logger.info(f"Shape: {G_original.shape}")
        logger.info(f"G:\n{G_original}")
        logger.info(f"{'='*60}\n")
        
        return {
            "success": True,
            "H": H.tolist(),
            "G_original": G_original.tolist(),
            "G_full": G_full.tolist(),
            "non_pivoted_columns": non_pivoted_columns,
            "dimensions": {
                "k": k,
                "n": n,
                "rows": len(non_pivoted_columns),  # (n-k)
                "cols": n
            }
        }
        
    except Exception as e:
        logger.error(f"Error extracting parity matrix: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }


def verify_parity_check(G, H, modulus):
    """
    Verify that G × H^T ≡ 0 (mod p).
    
    Args:
        G: Generator matrix (k×n)
        H: Parity check matrix ((n-k)×n)
        modulus: Z_p modulus
        
    Returns:
        Dictionary with verification result
    """
    try:
        G_np = np.array(G, dtype=np.int32) % modulus
        H_np = np.array(H, dtype=np.int32) % modulus
        
        logger.info(f"\n{'='*50}")
        logger.info("Verifying G × H^T ≡ 0 (mod {modulus})")
        logger.info(f"G shape: {G_np.shape}")
        logger.info(f"H shape: {H_np.shape}")
        
        # G × H^T
        product = np.dot(G_np, H_np.T) % modulus
        
        logger.info(f"G × H^T (mod {modulus}):\n{product}")
        
        # Check if all zeros
        is_zero = np.all(product == 0)
        
        logger.info(f"Is zero matrix: {is_zero}")
        logger.info(f"{'='*50}\n")
        
        return {
            "success": True,
            "is_valid": bool(is_zero),
            "product": product.tolist()
        }
        
    except Exception as e:
        logger.error(f"Error during verification: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }