<?php

namespace AmzsCMS\GalleryBundle\DependencyInjection;

use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Definition\ConfigurationInterface;

class Configuration implements ConfigurationInterface
{

    public function getConfigTreeBuilder(): TreeBuilder
    {
        $treeBuilder = new TreeBuilder('amzs_gallery_bundle');

        $root = $treeBuilder->getRootNode();

//        // optional bundle config here
        $root
            ->children()
                ->scalarNode('default_password')
                ->defaultValue('amzsolution@' . date('Y'))
                ->end()
            ->end();
        return $treeBuilder;
    }
}