<?php

namespace AmzsCMS\GalleryBundle\Traits;
use Doctrine\ORM\Mapping as ORM;

trait DoctrineIdentifierTrait
{
    /**
     * @ORM\Column(type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private  $id;

    /**
     * @return mixed
     */
    public function getId()
    {
        return $this->id;
    }
}