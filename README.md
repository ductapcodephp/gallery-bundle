Installation
============

Make sure Composer is installed globally, as explained in the
[installation chapter](https://getcomposer.org/doc/00-intro.md)
of the Composer documentation.

Applications that use Symfony Flex
----------------------------------

Open a command console, enter your project directory and execute:

```console
$ composer require <package-name>
```

Applications that don't use Symfony Flex
----------------------------------------

### Step 1: Download the Bundle

Open a command console, enter your project directory and execute the
following command to download the latest stable version of this bundle:

```console
$ composer require friendsofsymfony/jsrouting-bundle
```

### Step 2: Enable the Bundle

Then, enable the bundle by adding it to the list of registered bundles
in the `config/bundles.php` file of your project:

```php
// config/bundles.php

return [
    // ...
    FOS\JsRoutingBundle\FOSJsRoutingBundle::class => ['all' => true],
];
```
### Step 3 : Add route in routes.yaml (if don't find this file you can create in your project)
fos_js_routing:
  resource: "@FOSJsRoutingBundle/Resources/config/routing/routing.xml"

### Step 4: run in cmd 
php bin/console assets:install --symlink
### Step 5: Clear cache
php bin/console cache:clear
### Step 6: Check route
php bin/console fos:js-routing:debug | grep gallery


