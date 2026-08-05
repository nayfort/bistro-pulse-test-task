<?php

if (!defined('ABSPATH')) {
    exit;
}

class UA_Delivery_Shipping_Method extends WC_Shipping_Method
{
    public function __construct($instance_id = 0)
    {
        $this->id = 'ua_delivery_shipping';
        $this->instance_id = absint($instance_id);
        $this->method_title = __('UA Delivery', 'ua-delivery-shipping');
        $this->method_description = __('Shipping method with city, warehouse and comment checkout fields.', 'ua-delivery-shipping');
        $this->supports = ['shipping-zones', 'instance-settings'];

        $this->init();
    }

    public function init()
    {
        $this->init_form_fields();
        $this->init_settings();

        $this->title = $this->get_option('title', __('UA Delivery', 'ua-delivery-shipping'));
        $this->enabled = $this->get_option('enabled', 'yes');
        $this->cost = (float) $this->get_option('cost', 0);
        $this->np_api_key = sanitize_text_field($this->get_option('np_api_key', ''));

        add_action('woocommerce_update_options_shipping_' . $this->id, [$this, 'process_admin_options']);
    }

    public function init_form_fields()
    {
        $this->form_fields = [
            'enabled' => [
                'title' => __('Enable', 'ua-delivery-shipping'),
                'type' => 'checkbox',
                'label' => __('Enable UA Delivery shipping', 'ua-delivery-shipping'),
                'default' => 'yes',
            ],
            'title' => [
                'title' => __('Title', 'ua-delivery-shipping'),
                'type' => 'text',
                'default' => __('UA Delivery', 'ua-delivery-shipping'),
                'desc_tip' => true,
            ],
            'cost' => [
                'title' => __('Fixed cost', 'ua-delivery-shipping'),
                'type' => 'price',
                'default' => '0',
            ],
            'np_api_key' => [
                'title' => __('Nova Poshta API key', 'ua-delivery-shipping'),
                'type' => 'password',
                'default' => '',
                'description' => __('Optional. Used by custom integrations and cached directory requests.', 'ua-delivery-shipping'),
            ],
        ];
    }

    public function calculate_shipping($package = [])
    {
        $this->add_rate([
            'id' => $this->get_rate_id(),
            'label' => $this->title,
            'cost' => $this->cost,
            'package' => $package,
        ]);
    }
}

