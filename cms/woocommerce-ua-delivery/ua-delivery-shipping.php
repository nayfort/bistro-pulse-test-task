<?php
/**
 * Plugin Name: UA Delivery Shipping for WooCommerce
 * Description: Test-task shipping method with city, warehouse, comment fields, validation, order meta, logs, and optional API hooks.
 * Version: 1.0.0
 * Author: Test Task Candidate
 * Text Domain: ua-delivery-shipping
 * Domain Path: /languages
 * Requires Plugins: woocommerce
 */

if (!defined('ABSPATH')) {
    exit;
}

define('UA_DELIVERY_SHIPPING_FILE', __FILE__);
define('UA_DELIVERY_SHIPPING_DIR', plugin_dir_path(__FILE__));

add_action('plugins_loaded', function () {
    if (!class_exists('WooCommerce')) {
        return;
    }

    load_plugin_textdomain('ua-delivery-shipping', false, dirname(plugin_basename(__FILE__)) . '/languages');

    require_once UA_DELIVERY_SHIPPING_DIR . 'includes/class-ua-delivery-shipping-method.php';
    require_once UA_DELIVERY_SHIPPING_DIR . 'includes/class-ua-delivery-checkout.php';

    add_filter('woocommerce_shipping_methods', function ($methods) {
        $methods['ua_delivery_shipping'] = 'UA_Delivery_Shipping_Method';
        return $methods;
    });

    new UA_Delivery_Checkout();
});

