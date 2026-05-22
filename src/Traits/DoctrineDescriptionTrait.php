<?php

namespace AmzsCMS\GalleryBundle\Traits;

use Doctrine\ORM\Mapping as ORM;

trait DoctrineDescriptionTrait
{
    /**
     * @ORM\Column(type="text", nullable=true)
     */
    private $description;

    /**
     * @return mixed
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * @param mixed $description
     */
    public function setDescription($description): void
    {
        $this->description = $description;
    }
}