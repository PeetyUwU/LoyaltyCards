INSERT INTO
    roles (role_name)
VALUES
    ('owner'),
    ('admin'),
    ('user');

INSERT INTO
    barcode_types (
        code,
        numeric_only,
        fixed_length,
        min_length,
        max_length
    )
VALUES
    ('EAN13', TRUE, 13, NULL, NULL),
    ('EAN8', TRUE, 8, NULL, NULL),
    ('CODE128', FALSE, NULL, 1, 48),
    ('QR', FALSE, NULL, 1, 4296),
    ('PDF417', FALSE, NULL, 1, 1850);

INSERT INTO
    company_preset (name, image_url, color_scheme, barcode_type_id)
VALUES
    (
        'tesco',
        '/presets/tesco.png',
        '#00539F',
        (
            SELECT
                id
            FROM
                barcode_types
            WHERE
                code = 'EAN13'
        )
    ),
    (
        'albert',
        '/presets/albert.png',
        '#E30613',
        (
            SELECT
                id
            FROM
                barcode_types
            WHERE
                code = 'EAN13'
        )
    ),
    (
        'billa',
        '/presets/billa.png',
        '#FCD900',
        (
            SELECT
                id
            FROM
                barcode_types
            WHERE
                code = 'CODE128'
        )
    );