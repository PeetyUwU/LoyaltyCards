CREATE TABLE
    IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_name VARCHAR(20) UNIQUE NOT NULL
    );

-- seed: owner, admin, user
CREATE TABLE
    IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active_at TIMESTAMP NULL,
        FOREIGN KEY (role_id) REFERENCES roles (id)
    );

CREATE TABLE
    IF NOT EXISTS user_settings (
        user_id INT PRIMARY KEY,
        locale VARCHAR(10) NOT NULL DEFAULT 'cs',
        font_size ENUM ('small', 'medium', 'large') NOT NULL DEFAULT 'medium',
        theme ENUM ('light', 'dark', 'system') NOT NULL DEFAULT 'system',
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS barcode_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) UNIQUE NOT NULL, -- EAN13, CODE128, QR, PDF417...
        numeric_only BOOLEAN NOT NULL DEFAULT FALSE,
        fixed_length INT NULL, -- e.g. 13 for EAN13, 8 for EAN8; NULL if variable
        min_length INT NULL, -- only meaningful when fixed_length IS NULL
        max_length INT NULL
    );

CREATE TABLE
    IF NOT EXISTS company_preset (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) UNIQUE NOT NULL, -- key into the .lang files, e.g. "tesco"
        image_url TEXT NOT NULL,
        color_scheme VARCHAR(50),
        barcode_type_id INT NOT NULL, -- EAN13, CODE128, QR, PDF417...
        FOREIGN KEY (barcode_type_id) REFERENCES barcode_types (id)
    );

CREATE TABLE
    IF NOT EXISTS cards (
        id INT PRIMARY KEY AUTO_INCREMENT,
        created_by INT NOT NULL,
        company_preset_id INT NULL, -- NULL = custom card
        card_name VARCHAR(100) NOT NULL,
        code VARCHAR(255) NOT NULL,
        barcode_type_id INT NULL, -- overrides preset's; set this if company_preset_id IS NULL
        color_scheme VARCHAR(50), -- overrides preset's
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users (id),
        FOREIGN KEY (company_preset_id) REFERENCES company_preset (id),
        FOREIGN KEY (barcode_type_id) REFERENCES barcode_types (id)
    );

CREATE TABLE
    IF NOT EXISTS card_access (
        card_id INT NOT NULL,
        user_id INT NOT NULL,
        access_level ENUM ('owner', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
        shared_by INT,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (card_id, user_id),
        FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by) REFERENCES users (id)
    );