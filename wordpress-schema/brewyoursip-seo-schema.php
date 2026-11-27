<?php
/**
 * Plugin Name: Brew Your Sip SEO / AEO / GEO Schema & Yoast REST Connector
 * Description: Autonomous JSON-LD Organization, LocalBusiness, Speakable Schema, and Yoast SEO REST API meta registration for www.brewyoursip.com.
 * Version: 1.1.0
 * Author: Brew Your Sip SEO Agent
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// 1. Expose Yoast SEO & Rank Math meta keys to the WordPress REST API so the autonomous agent can set Title, Meta Description, and Focus Keyphrase
add_action( 'init', function() {
    $seo_meta_keys = array(
        '_yoast_wpseo_title',
        '_yoast_wpseo_metadesc',
        '_yoast_wpseo_focuskw',
        'rank_math_title',
        'rank_math_description',
        'rank_math_focus_keyword',
    );

    foreach ( $seo_meta_keys as $meta_key ) {
        register_post_meta( 'post', $meta_key, array(
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => 'string',
            'auth_callback' => function() {
                return current_user_can( 'edit_posts' );
            },
        ) );
    }
} );

// 2. Inject Organization, LocalBusiness, and Speakable JSON-LD into wp_head
add_action( 'wp_head', function() {
    $org_schema = array(
        '@context' => 'https://schema.org',
        '@type' => array( 'Organization', 'LocalBusiness' ),
        'name' => 'Brew Your Sip',
        'legalName' => 'Unik Tea Centre Pvt Ltd',
        'url' => 'https://www.brewyoursip.com',
        'foundingDate' => '1988',
        'founder' => array(
            '@type' => 'Person',
            'name' => 'Ashok Shah',
            'jobTitle' => 'Founder & Master Tea Taster'
        ),
        'address' => array(
            '@type' => 'PostalAddress',
            'addressLocality' => 'Kolkata',
            'addressRegion' => 'West Bengal',
            'addressCountry' => 'IN'
        ),
        'description' => 'Artisan single-estate Darjeeling and Assam orthodox loose leaf tea backed by 35+ years of Kolkata tea auction heritage since 1988.'
    );

    echo "\n<!-- Brew Your Sip Autonomous SEO/AEO/GEO Schema -->\n";
    echo '<script type="application/ld+json">' . wp_json_encode( $org_schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";

    if ( is_single() ) {
        $speakable = array(
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => get_the_title(),
            'url' => get_permalink(),
            'speakable' => array(
                '@type' => 'SpeakableSpecification',
                'cssSelector' => array( '#aeo-quick-answer', '.eeat-editorial-banner' )
            )
        );
        echo '<script type="application/ld+json">' . wp_json_encode( $speakable, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . '</script>' . "\n";
    }
}, 5 );
