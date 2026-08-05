<?php

if (!defined('ABSPATH')) {
    exit;
}

class UA_Delivery_Checkout
{
    private $meta_keys = [
        'city' => '_ua_delivery_city',
        'warehouse' => '_ua_delivery_warehouse',
        'comment' => '_ua_delivery_comment',
    ];

    public function __construct()
    {
        add_filter('woocommerce_checkout_fields', [$this, 'add_checkout_fields']);
        add_action('woocommerce_checkout_process', [$this, 'validate_checkout_fields']);
        add_action('woocommerce_checkout_create_order', [$this, 'save_order_meta'], 10, 2);
        add_action('woocommerce_admin_order_data_after_shipping_address', [$this, 'render_admin_order_meta']);
        add_filter('woocommerce_email_order_meta_fields', [$this, 'email_order_meta'], 10, 3);
        add_action('woocommerce_order_status_processing', [$this, 'trigger_processing_webhook']);
    }

    public function add_checkout_fields($fields)
    {
        $fields['shipping']['ua_delivery_city'] = [
            'type' => 'text',
            'label' => __('City', 'ua-delivery-shipping'),
            'required' => true,
            'priority' => 91,
        ];

        $fields['shipping']['ua_delivery_warehouse'] = [
            'type' => 'text',
            'label' => __('Warehouse', 'ua-delivery-shipping'),
            'required' => true,
            'priority' => 92,
        ];

        $fields['shipping']['ua_delivery_comment'] = [
            'type' => 'textarea',
            'label' => __('Delivery comment', 'ua-delivery-shipping'),
            'required' => false,
            'priority' => 93,
        ];

        return $fields;
    }

    public function validate_checkout_fields()
    {
        $chosen_methods = WC()->session ? WC()->session->get('chosen_shipping_methods') : [];
        $uses_method = is_array($chosen_methods) && in_array('ua_delivery_shipping', array_map([$this, 'base_method_id'], $chosen_methods), true);

        if (!$uses_method) {
            return;
        }

        $city = sanitize_text_field(wp_unslash($_POST['ua_delivery_city'] ?? ''));
        $warehouse = sanitize_text_field(wp_unslash($_POST['ua_delivery_warehouse'] ?? ''));

        if ($city === '' || !preg_match('/^[\p{L}\s\'’.-]{2,80}$/u', $city)) {
            wc_add_notice(__('Please enter a valid delivery city.', 'ua-delivery-shipping'), 'error');
        }

        if ($warehouse === '' || mb_strlen($warehouse) > 120) {
            wc_add_notice(__('Please enter a valid warehouse.', 'ua-delivery-shipping'), 'error');
        }
    }

    public function save_order_meta($order, $data)
    {
        $city = sanitize_text_field(wp_unslash($_POST['ua_delivery_city'] ?? ''));
        $warehouse = sanitize_text_field(wp_unslash($_POST['ua_delivery_warehouse'] ?? ''));
        $comment = sanitize_textarea_field(wp_unslash($_POST['ua_delivery_comment'] ?? ''));

        $order->update_meta_data($this->meta_keys['city'], $city);
        $order->update_meta_data($this->meta_keys['warehouse'], $warehouse);
        $order->update_meta_data($this->meta_keys['comment'], $comment);
    }

    public function render_admin_order_meta($order)
    {
        $city = $order->get_meta($this->meta_keys['city']);
        $warehouse = $order->get_meta($this->meta_keys['warehouse']);
        $comment = $order->get_meta($this->meta_keys['comment']);

        if (!$city && !$warehouse && !$comment) {
            return;
        }

        echo '<h3>' . esc_html__('UA Delivery', 'ua-delivery-shipping') . '</h3>';
        echo '<p><strong>' . esc_html__('City:', 'ua-delivery-shipping') . '</strong> ' . esc_html($city) . '</p>';
        echo '<p><strong>' . esc_html__('Warehouse:', 'ua-delivery-shipping') . '</strong> ' . esc_html($warehouse) . '</p>';

        if ($comment) {
            echo '<p><strong>' . esc_html__('Comment:', 'ua-delivery-shipping') . '</strong> ' . esc_html($comment) . '</p>';
        }
    }

    public function email_order_meta($fields, $sent_to_admin, $order)
    {
        $fields['ua_delivery_city'] = [
            'label' => __('Delivery city', 'ua-delivery-shipping'),
            'value' => $order->get_meta($this->meta_keys['city']),
        ];

        $fields['ua_delivery_warehouse'] = [
            'label' => __('Delivery warehouse', 'ua-delivery-shipping'),
            'value' => $order->get_meta($this->meta_keys['warehouse']),
        ];

        return $fields;
    }

    public function trigger_processing_webhook($order_id)
    {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $logger = wc_get_logger();
        $context = ['source' => 'ua-delivery-shipping'];
        $logger->info(sprintf('Order %d moved to processing; delivery city=%s warehouse=%s', $order_id, $order->get_meta($this->meta_keys['city']), $order->get_meta($this->meta_keys['warehouse'])), $context);

        do_action('ua_delivery_shipping_order_ready', $order_id, [
            'city' => $order->get_meta($this->meta_keys['city']),
            'warehouse' => $order->get_meta($this->meta_keys['warehouse']),
            'comment' => $order->get_meta($this->meta_keys['comment']),
        ]);
    }

    private function base_method_id($method)
    {
        return strtok((string) $method, ':');
    }
}

