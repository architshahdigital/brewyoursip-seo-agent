<?php
/**
 * Plugin Name: Brew Your Sip SEO / AEO / GEO Schema Injector
 * Description: Autonomous JSON-LD Organization, LocalBusiness, WebSite, and Speakable Schema for www.brewyoursip.com (WordPress / WooCommerce).
 * Version: 1.0.0
 * Author: Brew Your Sip SEO Agent
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

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
